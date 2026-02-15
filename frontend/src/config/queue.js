import { Queue } from "bullmq";
import { createRedisConnection } from "./redis.config.js";

// Create Redis connection using shared configuration
const connection = createRedisConnection();

// Exit process on Redis connection error
connection.on("error", (error) => {
    console.error("❌ Redis connection error:", error);
    process.exit(1);
});

// Create BullMQ Queue for music uploads
export const uploadQueue = new Queue("music-upload", {
    connection,
});

// Queue event listeners
uploadQueue.on("error", (error) => {
    console.error("Queue error:", error);
});

uploadQueue.on("waiting", (job) => {
    const jobId = job?.id || job || 'unknown';
    console.log(`Job ${jobId} is waiting to be processed`);
});

console.log("Upload queue initialized for 'music-upload'");

export default uploadQueue;
