import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
});

export const uploadQueue = new Queue("music-upload", {
    connection,
});

export default uploadQueue;
