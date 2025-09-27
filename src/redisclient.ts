import { Redis } from "ioredis";

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = (parseInt) (process.env.REDIS_PORT || "6379")

export const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT
});

redis.on("success", () => {
    console.log("Redis is connected!");
});

redis.on("error", (error) => {
    console.log("Error connecting to Redis due to ", error);
});