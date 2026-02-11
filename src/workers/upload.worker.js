import { Worker } from "bullmq";
import IORedis from "ioredis";
import { uploadMusicFile, uploadMusicImage } from "../service/upload.service.js";
import { deleteTempFile } from "../utils/file.utils.js";
import musicModel from "../models/music.model.js";

// Match BullMQ expectations for Redis client options
const connection = new IORedis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

// Add Redis connection event listeners
connection.on("connect", () => {
    console.log("✅ Worker Redis connected successfully");
});

connection.on("error", (error) => {
    console.error("❌ Worker Redis connection error:", error);
});

connection.on("ready", () => {
    console.log("✅ Worker Redis is ready");
});

const worker = new Worker(
    "music-upload",
    async (job) => {
        let userId, title, album;
        try {
            const {
                musicBuffer: musicBufferBase64,
                musicName,
                imageBuffer: imageBufferBase64,
                imageName,
                userId: jobUserId,
                title: jobTitle,
                album: jobAlbum,
            } = job.data;

            // Convert base64 strings back to buffers
            const musicBuffer = Buffer.from(musicBufferBase64, 'base64');
            const imageBuffer = Buffer.from(imageBufferBase64, 'base64');
            
            userId = jobUserId;
            title = jobTitle;
            album = jobAlbum;

            console.log(`Processing upload job ${job.id} for user ${userId}`);
            console.log(`Job data: title=${title}, album=${album || 'none'}, musicName=${musicName}, imageName=${imageName}`);
            console.log(`Buffer sizes: music=${musicBuffer.length} bytes, image=${imageBuffer.length} bytes`);

            // Upload image to ImageKit
            console.log(`Uploading image for job ${job.id}...`);
            const imageResult = await uploadMusicImage(imageBuffer, imageName);
            console.log(`Image uploaded successfully: ${imageResult.url}`);
            console.log(`Image temp file: ${imageResult.tempPath}`);

            // Upload music file to ImageKit
            console.log(`Uploading music file for job ${job.id}...`);
            const musicResult = await uploadMusicFile(musicBuffer, musicName);
            console.log(`Music file uploaded successfully: ${musicResult.url}`);
            console.log(`Music temp file: ${musicResult.tempPath}`);

            // Save to database
            console.log(`Saving music to database for job ${job.id}...`);
            const music = await musicModel.create({
                title,
                uri: musicResult.url,
                image: imageResult.url,
                album: album || null,
                artist: userId,
            });
            console.log(`Music saved to database with ID: ${music._id}`);

            // Delete temp files after successful save
            if (imageResult.tempPath) {
                console.log(`Deleting image temp file: ${imageResult.tempPath}`);
                await deleteTempFile(imageResult.tempPath);
            }
            if (musicResult.tempPath) {
                console.log(`Deleting music temp file: ${musicResult.tempPath}`);
                await deleteTempFile(musicResult.tempPath);
            }

            console.log(`Upload completed for user ${userId}, music ID: ${music._id}`);

            return {
                success: true,
                musicId: music._id,
                musicUrl: musicResult.url,
                imageUrl: imageResult.url,
            };
        } catch (error) {
            console.error(`❌ Upload job ${job.id} failed:`, error.message);
            console.error(`Error stack:`, error.stack);
            console.error(`Error details:`, {
                name: error.name,
                message: error.message,
                userId,
                title,
            });
            throw error;
        }
    },
    {
        connection,
        concurrency: 5,
    }
);

// Handle worker events
worker.on("ready", () => {
    console.log("Upload worker is ready and listening for jobs on queue 'music-upload'");
});

worker.on("active", (job) => {
    console.log(`Job ${job.id} is now active - starting processing`);
});

worker.on("completed", (job, result) => {
    console.log(`✅ Job ${job.id} completed successfully:`, result);
});

worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err.message);
    console.error("Error details:", err);
});

worker.on("error", (error) => {
    console.error("Worker error:", error);
});

export default worker;
