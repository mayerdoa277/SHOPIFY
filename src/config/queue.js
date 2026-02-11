import { Queue } from "bullmq";
import IORedis from "ioredis";

// BullMQ requires maxRetriesPerRequest to be null for blocking operations
const connection = new IORedis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

// Add Redis connection event listeners
connection.on("connect", () => {
    console.log("✅ Redis connected successfully");
});

connection.on("error", (error) => {
    console.error("❌ Redis connection error:", error);
});

connection.on("ready", () => {
    console.log("✅ Redis is ready");
});

export const uploadQueue = new Queue("music-upload", {
    connection,
});

// Add queue event listeners for debugging
uploadQueue.on("error", (error) => {
    console.error("Queue error:", error);
});

uploadQueue.on("waiting", (jobId) => {
    console.log(`Job ${jobId} is waiting to be processed`);
});

console.log("Upload queue initialized for 'music-upload'");

export default uploadQueue;
