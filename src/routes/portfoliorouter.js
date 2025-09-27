import { Router } from "express";
import { PrismaClient } from "../generated/prisma/index.js";
import { authenticateJWT } from "../security/jwthandler.js";
import { redis } from "../redisclient.js";

const prisma = new PrismaClient();
const portfolioRouter = Router();

// TTL for portfolio redis cache (5 mins)..
const REDIS_CACHE_TTL = 300;

portfolioRouter.get("/", authenticateJWT, async (req, res) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const cacheKey = `portfolio:${userId}`;

    // Check Redis first..
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    // Fetch user wallet..
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch all transactions of the logged-in user, include product info..
    const transactions = await prisma.transaction.findMany({
        where: { userId },
        include: { product: true }
    });

    // Portfolio Aggregation..
    // Creating a map to aggregate holdings by product..
    const holdingsMap = new Map();

    // Loop through each transaction..
    // The purpose is to aggregate all transactions per product into a single record..
    for (const txn of transactions) {
        const prev = holdingsMap.get(txn.productId);
        const totalCost = parseFloat(txn.buyPrice.toString()) * txn.units;
        if (prev) {
            holdingsMap.set(txn.productId, {
                units: prev.units + txn.units,
                totalCost: prev.totalCost + totalCost,
                currentPrice: parseFloat(txn.product.price.toString()),
                name: txn.product.name
            });
        } else {
            holdingsMap.set(txn.productId, {
                units: txn.units,
                totalCost,
                currentPrice: parseFloat(txn.product.price.toString()),
                name: txn.product.name
            });
        }
    }

    // Prepare final holdings array & portfolio totals..
    const holdings = [];
    let totalInvested = 0;
    let currentVal = 0;

    holdingsMap.forEach((value, productId) => {
        const avgBuyPrice = value.totalCost / value.units;
        holdings.push({
            productId,
            name: value.name,
            units: value.units,
            buyPrice: avgBuyPrice,
            currentPrice: value.currentPrice
        });
        totalInvested += avgBuyPrice * value.units;
        currentVal += value.currentPrice * value.units;
    });

    // Prepare final portfolio data for API response..
    const portfolioData = {
        wallet: parseFloat(user.wallet.toString()),
        totalInvested,
        currentVal,
        returns: currentVal - totalInvested,
        holdings
    };

    // Redis caching with a TTL for expiration..
    await redis.setex(cacheKey, REDIS_CACHE_TTL, JSON.stringify(portfolioData));

    res.json(portfolioData);
});

export default portfolioRouter;
