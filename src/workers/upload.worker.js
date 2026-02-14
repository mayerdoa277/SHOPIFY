import { Worker } from "bullmq";
import { createRedisConnection } from "../config/redis.config.js";
import { uploadMusicFile, uploadMusicImage } from "../service/upload.service.js";
import { deleteTempFile } from "../utils/file.utils.js";
import musicModel from "../models/music.model.js";
import albumModel from "../models/album.model.js";

// Create Redis connection using shared configuration
const connection = createRedisConnection();

// Create BullMQ Worker for music uploads
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

            const musicBuffer = Buffer.from(musicBufferBase64, 'base64');
            const imageBuffer = Buffer.from(imageBufferBase64, 'base64');
            
            userId = jobUserId;
            title = jobTitle;
            album = jobAlbum;

            console.log(`Processing upload job ${job.id} for user ${userId}`);
            console.log(`Job data: title=${title}, album=${album || 'none'}, musicName=${musicName}, imageName=${imageName}`);
            console.log(`Buffer sizes: music=${musicBuffer.length} bytes, image=${imageBuffer.length} bytes`);

            console.log(`Uploading image for job ${job.id}...`);
            const imageResult = await uploadMusicImage(imageBuffer, imageName);
            console.log(`Image uploaded successfully: ${imageResult.url}`);
            console.log(`Image temp file: ${imageResult.tempPath}`);

            console.log(`Uploading music file for job ${job.id}...`);
            const musicResult = await uploadMusicFile(musicBuffer, musicName);
            console.log(`Music file uploaded successfully: ${musicResult.url}`);
            console.log(`Music temp file: ${musicResult.tempPath}`);

            console.log(`Saving music to database for job ${job.id}...`);
            const music = await musicModel.create({
                title,
                uri: musicResult.url,
                image: imageResult.url,
                album: album || null,
                artist: userId,
            });
            console.log(`Music saved to database with ID: ${music._id}`);

            if (album) {
                console.log(`Adding music ${music._id} to album ${album}`);
                await albumModel.findByIdAndUpdate(
                    album,
                    {
                        $push: {
                            musics: music._id,
                        },
                    },
                    { new: true }
                );
                console.log(`Successfully added music ${music._id} to album ${album}`);
            }

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

// Worker event listeners
worker.on("ready", () => {
    console.log("Upload worker is ready and listening for jobs on queue 'music-upload'");
});

worker.on("active", (job) => {
    const jobId = job?.id || job || 'unknown';
    console.log(`Job ${jobId} is now active - starting processing`);
});

worker.on("completed", (job, result) => {
    const jobId = job?.id || job || 'unknown';
    console.log(`✅ Job ${jobId} completed successfully:`, result);
});

worker.on("failed", (job, err) => {
    const jobId = job?.id || job || 'unknown';
    console.error(`❌ Job ${jobId} failed:`, err.message);
    console.error("Error details:", err);
});

worker.on("error", (error) => {
    console.error("Worker error:", error);
});

export default worker;
