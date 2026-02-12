import { Worker } from "bullmq"; // Import the BullMQ Worker class, which consumes jobs from a queue.
import IORedis from "ioredis"; // Import the ioredis client used to connect to a Redis server.
import { uploadMusicFile, uploadMusicImage } from "../service/upload.service.js"; // Import helper functions that upload music and image files to ImageKit.
import { deleteTempFile } from "../utils/file.utils.js"; // Import utility to delete temporary files from disk.
import musicModel from "../models/music.model.js"; // Import the Mongoose model for persisting Music documents to MongoDB.
import albumModel from "../models/album.model.js"; // Import the Album model so we can push new tracks into an album.

// Create a Redis connection with options tailored for BullMQ workers (no per-request retry limit, no ready check).
const connection = new IORedis({
    host: process.env.REDIS_HOST || "127.0.0.1", // Use REDIS_HOST from environment or default to localhost.
    port: process.env.REDIS_PORT || 6379, // Use REDIS_PORT from environment or default Redis port 6379.
    maxRetriesPerRequest: null, // Required by BullMQ so that blocking commands do not hit a retry limit.
    enableReadyCheck: false, // Disable the ready check to avoid extra overhead with BullMQ workers.
});

// Attach a listener for the Redis "connect" event to log successful connections.
connection.on("connect", () => {
    console.log("✅ Worker Redis connected successfully"); // Confirm that the worker's Redis client is connected.
});

// Attach a listener for the Redis "error" event to log connection or runtime errors.
connection.on("error", (error) => {
    console.error("❌ Worker Redis connection error:", error); // Log any Redis-related error for debugging.
});

// Attach a listener for the Redis "ready" event to log when the client is fully ready to use.
connection.on("ready", () => {
    console.log("✅ Worker Redis is ready"); // Indicate that the Redis client has finished its initialization.
});

// Create a BullMQ Worker instance that will process jobs from the "music-upload" queue.
const worker = new Worker(
    "music-upload", // Name of the queue this worker listens to; must match the producer side.
    async (job) => { // Processor function that is called for each job pulled from the queue.
        let userId, title, album; // Local variables to hold job-related metadata for logging and error reporting.
        try {
            // Destructure relevant fields from the job payload; note we rename some keys for clarity.
            const {
                musicBuffer: musicBufferBase64, // Base64-encoded music file buffer from the job data.
                musicName, // Original music file name from the job data.
                imageBuffer: imageBufferBase64, // Base64-encoded image file buffer from the job data.
                imageName, // Original image file name from the job data.
                userId: jobUserId, // User ID that requested the upload, coming from the controller.
                title: jobTitle, // Music title provided by the client.
                album: jobAlbum, // Optional album ID to associate this track with.
            } = job.data; // All of the above are read from the job's serialized data.

            // Convert the base64-encoded strings back into binary Buffers that can be written to disk or uploaded.
            const musicBuffer = Buffer.from(musicBufferBase64, 'base64'); // Decode the music buffer from base64 text into a Buffer.
            const imageBuffer = Buffer.from(imageBufferBase64, 'base64'); // Decode the image buffer from base64 text into a Buffer.
            
            // Assign unpacked values to outer-scoped variables for reuse in logs and error reporting.
            userId = jobUserId; // Keep track of which user owns this upload.
            title = jobTitle; // Track the title string for logs and potential debugging.
            album = jobAlbum; // Track the optional album ID if provided.

            // Log that processing has started for this specific job and user.
            console.log(`Processing upload job ${job.id} for user ${userId}`); // Helpful for tracing which job is being worked on.
            // Log the high-level job metadata such as title, album, and original filenames.
            console.log(`Job data: title=${title}, album=${album || 'none'}, musicName=${musicName}, imageName=${imageName}`); // Make debugging easier by printing critical job details.
            // Log the decoded buffer sizes to get a sense of file size and detect anomalies.
            console.log(`Buffer sizes: music=${musicBuffer.length} bytes, image=${imageBuffer.length} bytes`); // Helps verify that the data has been correctly decoded.

            // Begin uploading the image file portion of the job to ImageKit via the upload service.
            console.log(`Uploading image for job ${job.id}...`); // Informational log before starting the image upload.
            const imageResult = await uploadMusicImage(imageBuffer, imageName); // Upload the image buffer and receive ImageKit response (including URL and temp path).
            console.log(`Image uploaded successfully: ${imageResult.url}`); // Log the final public URL for the uploaded image.
            console.log(`Image temp file: ${imageResult.tempPath}`); // Log the temporary file path on disk for later cleanup.

            // Next, upload the music (audio) file to ImageKit using the upload service.
            console.log(`Uploading music file for job ${job.id}...`); // Informational log before starting the music upload.
            const musicResult = await uploadMusicFile(musicBuffer, musicName); // Upload the music buffer and receive ImageKit response.
            console.log(`Music file uploaded successfully: ${musicResult.url}`); // Log the public URL for the uploaded music file.
            console.log(`Music temp file: ${musicResult.tempPath}`); // Log the temporary file path for the music temp file.

            // After successful uploads, persist a new Music document in MongoDB with both URLs and metadata.
            console.log(`Saving music to database for job ${job.id}...`); // Log that we are about to insert into the database.
            const music = await musicModel.create({
                title, // Title of the track as provided by the client.
                uri: musicResult.url, // Store the ImageKit URL of the music file under the "uri" field.
                image: imageResult.url, // Store the ImageKit URL of the cover image under the "image" field.
                album: album || null, // Save the album ID if provided, otherwise store null.
                artist: userId, // Link this music record to the artist (user) that initiated the upload.
            }); // This call inserts a new document into the "Music" collection.
            console.log(`Music saved to database with ID: ${music._id}`); // Confirm the new document's ID for debugging.

            // If an album was selected by the user during upload, add this music to that album's musics array.
            // This ensures that when a user selects an album, the uploaded track is automatically added to that album.
            // If no album was selected (album is null/undefined), the music remains standalone.
            if (album) {
                console.log(`Adding music ${music._id} to album ${album}`); // Log that we're updating the album.
                await albumModel.findByIdAndUpdate(
                    album, // The album ID that was provided in the upload request.
                    {
                        $push: {
                            musics: music._id, // Push the newly created music document's ID into the album's musics array.
                        },
                    },
                    { new: true } // Return the updated album document (though we don't use it here).
                );
                console.log(`Successfully added music ${music._id} to album ${album}`); // Confirm the album was updated.
            }

            // Once the database write has succeeded, clean up any temporary files previously written to disk.
            if (imageResult.tempPath) { // Only attempt deletion if a temp path was actually returned for the image.
                console.log(`Deleting image temp file: ${imageResult.tempPath}`); // Log which image temp file is being removed.
                await deleteTempFile(imageResult.tempPath); // Delete the image temp file using the shared file utility.
            }
            if (musicResult.tempPath) { // Only attempt deletion if a temp path was returned for the music file.
                console.log(`Deleting music temp file: ${musicResult.tempPath}`); // Log which music temp file is being removed.
                await deleteTempFile(musicResult.tempPath); // Delete the music temp file using the shared file utility.
            }

            // Indicate that the full upload and save pipeline has completed successfully for this user and track.
            console.log(`Upload completed for user ${userId}, music ID: ${music._id}`); // Final success message with the created music ID.

            // Return a structured result object that BullMQ will store as the job's completion result.
            return {
                success: true, // Flag the job as having succeeded.
                musicId: music._id, // Expose the new Music document's ID so it can be queried later if needed.
                musicUrl: musicResult.url, // Expose the public URL of the uploaded music file.
                imageUrl: imageResult.url, // Expose the public URL of the uploaded image file.
            }; // The caller (if they query job results) can use this metadata.
        } catch (error) { // Catch any errors that occur anywhere in the job processing pipeline.
            console.error(`❌ Upload job ${job.id} failed:`, error.message); // Log the high-level error message with the job ID.
            console.error(`Error stack:`, error.stack); // Log the stack trace for deeper debugging.
            console.error(`Error details:`, {
                name: error.name, // Include the error name.
                message: error.message, // Include the error message (again, for easy inspection in object form).
                userId, // Include the userId associated with this job, if it was set.
                title, // Include the title that was being processed.
            }); // Collect key context to help diagnose what went wrong.
            throw error; // Re-throw the error so BullMQ marks the job as failed and can retry or log appropriately.
        }
    },
    {
        connection, // Pass the shared Redis connection configuration into the worker.
        concurrency: 5, // Allow up to 5 jobs to be processed in parallel to improve throughput.
    }
);

// Attach event handlers to the worker instance to log lifecycle events for observability.
worker.on("ready", () => {
    console.log("Upload worker is ready and listening for jobs on queue 'music-upload'"); // Log when the worker is fully initialized and connected.
});

// Log whenever a job transitions into the "active" state, meaning processing has started.
worker.on("active", (job) => {
    console.log(`Job ${job.id} is now active - starting processing`); // Provide visibility into which job is currently being worked on.
});

// Log when a job completes successfully, including the result object returned by the processor.
worker.on("completed", (job, result) => {
    console.log(`✅ Job ${job.id} completed successfully:`, result); // Confirm successful completion and show what data was returned.
});

// Log when a job fails after processing, including the error message and error object for details.
worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err.message); // High-level failure message indicating the job ID and error reason.
    console.error("Error details:", err); // Dump the entire error object for more debugging context.
});

// Log any worker-level errors not tied directly to a single job (e.g., Redis or internal worker errors).
worker.on("error", (error) => {
    console.error("Worker error:", error); // Report non-job-specific errors affecting the worker itself.
});

// Export the configured worker as the default export so it can be started and monitored from server.js.
export default worker;
