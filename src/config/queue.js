import { Queue } from "bullmq"; // Import the BullMQ Queue class used for pushing jobs to a Redis-backed queue.
import IORedis from "ioredis"; // Import the ioredis client library to handle low-level Redis connections.

// Create a Redis connection configured according to BullMQ's recommendations for queues.
const connection = new IORedis({
    host: process.env.REDIS_HOST || "127.0.0.1", // Use REDIS_HOST from environment or default to localhost if not set.
    port: process.env.REDIS_PORT || 6379, // Use REDIS_PORT from environment or default to port 6379.
    maxRetriesPerRequest: null, // Allow blocking operations by disabling the max retries per request limit.
    enableReadyCheck: false, // Disable ready checks to speed up client readiness for BullMQ.
});

// Listen for successful connection events on the Redis client and log them.
connection.on("connect", () => {
    console.log("✅ Redis connected successfully"); // Indicates that the app's Redis connection for queues is established.
});

// Listen for error events on the Redis client to catch connectivity or command issues.
connection.on("error", (error) => {
    console.error("❌ Redis connection error:", error); // Log Redis errors, which can cause queue failures.
});

// Listen for the "ready" event to know when Redis is fully initialized and ready to accept commands.
connection.on("ready", () => {
    console.log("✅ Redis is ready"); // Confirms that Redis can now reliably serve BullMQ operations.
});

// Listen for the "close" event to detect when the Redis connection is closed, which can impact queue processing.
connection.on("close", () => {
    console.warn("⚠️ Redis connection closed"); // Warn that the Redis connection has been closed, which may require attention.
});

// if connect, error, ready, close events are not emitted, it means that the connection is not established or there is an issue with the Redis server. then stop the process.
connection.on("error", (error) => {
    console.error("❌ Redis connection error:", error); // Log Redis errors, which can cause queue failures.
    process.exit(1); // Exit the process with a failure status code.
});


// Create a BullMQ Queue instance specifically for music uploads; this is where jobs will be added.
export const uploadQueue = new Queue("music-upload", {
    connection, // Pass the configured Redis connection so jobs and workers use the same client.
});

// Attach event listeners directly to the queue instance for additional debugging and observability.
uploadQueue.on("error", (error) => {
    console.error("Queue error:", error); // Log any queue-level error (e.g., command failure, connection issues).
});

uploadQueue.on("waiting", (job) => {
    const jobId = job?.id || job || 'unknown';
    console.log(`Job ${jobId} is waiting to be processed`); // Log when a job is enqueued and waiting in the queue.
});

console.log("Upload queue initialized for 'music-upload'"); // Informative log that the upload queue has been created and set up.

// Export the queue as the default export so other modules can import it conveniently.
export default uploadQueue;
