import { Router, type Response } from "express";
import { PrismaClient } from "../generated/prisma/index.js";
import { redis } from "../redisclient.ts";

const prisma = new PrismaClient();
const productRouter = Router();

// Specify cache key..
const PRODUCT_CACHE_KEY = "products";

// Schedule caching every 2 minutes..
const cacheProducts = async () => {
    try {
        // Fetch and sort by ID in ascending order..
        const products = await prisma.product.findMany({orderBy: {id: "asc"}});
        await redis.set(PRODUCT_CACHE_KEY, JSON.stringify(products));
        console.log("Products Cache Refreshed!"); 
    } catch (error) {
        console.error("Error refreshing products cache:", error);
    }
}

cacheProducts();
setInterval(cacheProducts, 2 * 60 * 1000);


// List all products..
productRouter.get("/", async (_req, res: Response) => {
  try {
    const cached = await redis.get(PRODUCT_CACHE_KEY);
    if (cached) {
        return res.json(JSON.parse(cached));
    }
    const products = await prisma.product.findMany({
      orderBy: { id: "asc" },
    });
    await redis.set(PRODUCT_CACHE_KEY, JSON.stringify(products)); 
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a single product..
productRouter.get("/:id", async (req, res: Response) => {
  try {
    const productId = Number(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Step 1: Check cache..
    const cacheKey = `product:${productId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Step 2: DB lookup if not cached..
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Step 3: Save in cache with TTL (e.g. 120 seconds)..
    await redis.set(cacheKey, JSON.stringify(product), "EX", 120);

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default productRouter;
