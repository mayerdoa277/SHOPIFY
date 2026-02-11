import { Worker } from "bullmq";
import IORedis from "ioredis";
import { uploadMusicFile, uploadMusicImage } from "../service/upload.service.js";
import { deleteTempFile } from "../utils/file.utils.js";
import musicModel from "../models/music.model.js";

const connection = new IORedis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
});

const worker = new Worker(
    "music-upload",
    async (job) => {
        try {
            const {
                musicBuffer,
                musicName,
                imageBuffer,
                imageName,
                userId,
                title,
                album,
            } = job.data;

            console.log(`Processing upload job ${job.id} for user ${userId}`);

            // Upload image to ImageKit
            const imageResult = await uploadMusicImage(imageBuffer, imageName);

            // Upload music file to ImageKit
            const musicResult = await uploadMusicFile(musicBuffer, musicName);

            // Save to database
            const music = await musicModel.create({
                title,
                uri: musicResult.url,
                image: imageResult.url,
                album: album || null,
                artist: userId,
            });

            // Delete temp files after successful save
            if (imageResult.tempPath) {
                await deleteTempFile(imageResult.tempPath);
            }
            if (musicResult.tempPath) {
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
            console.error(`Upload job ${job.id} failed:`, error);
            throw error;
        }
    },
    {
        connection,
        concurrency: 5,
    }
);

// Handle worker events
worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
    console.error(`Job ${job.id} failed:`, err.message);
});

export default worker;
