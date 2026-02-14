import IORedis from "ioredis";

/**
 * Create and configure Redis connection for BullMQ
 * @returns {IORedis} - Configured Redis connection
 */
export const createRedisConnection = () => {
    const connection = new IORedis({
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: process.env.REDIS_PORT || 6379,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    });

    // Event listeners for Redis connection
    connection.on("connect", () => {
        console.log("✅ Redis connected successfully");
    });

    connection.on("error", (error) => {
        console.error("❌ Redis connection error:", error);
    });

    connection.on("ready", () => {
        console.log("✅ Redis is ready");
    });

    connection.on("close", () => {
        console.warn("⚠️ Redis connection closed");
    });

    return connection;
};

export default createRedisConnection;
