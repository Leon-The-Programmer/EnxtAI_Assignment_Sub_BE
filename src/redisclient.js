import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

export const redis = REDIS_URL
  ? new Redis(REDIS_URL)    // Use full URL if provided via environment variable..
  : new Redis({             // Fallback for local dev if not..
      host: REDIS_HOST,
      port: REDIS_PORT
    });

redis.on("connect", () => console.log("Redis is connected!"));
redis.on("error", (err) => console.log("Error connecting to Redis due to", err));
