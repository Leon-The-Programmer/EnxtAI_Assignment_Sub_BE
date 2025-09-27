import { Router } from "express";
import { PrismaClient } from "../generated/prisma/index.js";
import { authenticateJWT } from "../security/jwthandler.js";
import { redis } from "../redisclient.js";

const prisma = new PrismaClient();
const txnRouter = Router();

// Buy endpoint (JWT-protected)..
txnRouter.post("/buy", authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { productId, units } = req.body;

    if (!productId || !units) {
      return res.status(400).json({ message: "Missing productId or units" });
    }

    // Fetch product..
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Fetch user (to get wallet balance)..
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate total cost (Decimal multiplication)..
    const totalAmount = product.price.mul(units);
    const updatedWallet = user.wallet.sub(totalAmount);

    // Check if user has sufficient balance..
    if (user.wallet.lt(totalAmount)) {
      return res.status(400).json({ message: "Insufficient balance!" });
    }

    // Deduct amount from user's wallet..
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { wallet: updatedWallet },
    });

    // Record the transaction..
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        productId,
        units,
        buyPrice: product.price,
      },
    });

    // Invalidate Redis cache for a product because a new transaction has taken place for the same..
    await redis.del(`portfolio:${userId}`);
    console.log("Redis cache invalidated for the product:", product.name);

    res.json({
      message: "Purchase successful",
      transaction,
      remainingWallet: updatedUser.wallet,
    });

  } catch (error) {
    console.error("Error in /buy:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all transactions of the logged-in user..
// Sorted by newest first, pagination (page & limit query params)..
txnRouter.get("/get-txn", authenticateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Pagination params (optional, default: page 1, limit 10)..
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalCount = await prisma.transaction.count({
        where: { userId }
    });

    // Fetch transactions for user, include product info, sorted by newest first..
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    });

    res.json({
      page,
      limit,
      total: transactions.length,
      totalPages: Math.ceil(totalCount / limit),
      transactions
    });
  } catch (error) {
    console.error("Error in /get-transactions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default txnRouter;