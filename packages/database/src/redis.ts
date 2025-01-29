import Redis from "ioredis";
export * from "ioredis";
import { env } from "@workspace/env";
import { logger } from "@workspace/logger";

// export const redis = new Redis(config.REDIS_URL);

export const redis = new Redis(env.REDIS_URL, {
    retryStrategy: times => {
        const delay = Math.min(times * 50, 1000);
        return delay;
    },
    maxRetriesPerRequest: null,
});
redis.on("ready", () => {
    logger.info("✅ Redis client ready");
});

redis.on("connect", () => {
    logger.info("✅ Redis connected");
});
redis.on("error", error => {
    logger.error("❌ REDIS ERROR", error);
    // process.exit(1);
});
redis.on("reconnecting", () => {
    logger.info("🔄️ REDIS reconnecting...");
});
