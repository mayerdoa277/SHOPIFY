import { uploadQueue } from "../config/queue.js"; // Import the BullMQ queue instance where new upload jobs will be enqueued.

/**
 * Upload music with image to ImageKit and save to database (via background worker)
 * POST /api/music/upload
 * 
 * Form data:
 * - music: audio file (required)
 * - image: image file (required)
 * - title: string (required)
 * - album: album ID (optional)
 */
const uploadMusic = async (req, res) => { // Define an async Express handler for the music upload endpoint.
    try { // Wrap logic in try/catch to handle both validation and queue errors.
        const musicFile = req.files?.music?.[0]; // Extract the first uploaded "music" file from Multer's parsed request.
        const imageFile = req.files?.image?.[0]; // Extract the first uploaded "image" file from Multer's parsed request.
        const { title, album } = req.body || req.headers["authorization"].split(" ")[1]; // Read title and optional album from the body; fallback to headers is likely incorrect here.

        // Validation: ensure a music file has been provided.
        if (!musicFile) {
            return res.status(400).json({
                success: false, // Indicate failure due to invalid input.
                message: "Music file required", // Tell the client that the music file is missing.
            });
        }

        // Validation: ensure an image file has been provided.
        if (!imageFile) {
            return res.status(400).json({
                success: false, // Indicate failure due to invalid input.
                message: "Image file required", // Tell the client that the image file is missing.
            });
        }

        // Validation: ensure a title string has been provided.
        if (!title) {
            return res.status(400).json({
                success: false, // Indicate failure due to invalid input.
                message: "Title required", // Tell the client that the title is required.
            });
        }

        // NOTE: Album handling is done in the worker after music creation.
        // If album is provided, it will be passed to the queue and the worker will:
        // 1. Save the music with album reference
        // 2. Push the music ID into the album's musics array
        // If no album is provided, music is saved as standalone (album: null)

        // Add job to queue for background processing so the HTTP request returns quickly.
        // Convert buffers to base64 strings because BullMQ serializes objects and not raw Buffers.
        const musicBufferBase64 = musicFile.buffer.toString('base64'); // Convert the in-memory music Buffer to a base64 string.
        const imageBufferBase64 = imageFile.buffer.toString('base64'); // Convert the in-memory image Buffer to a base64 string.

        // Derive the user ID from the authenticated user (artist) stored by auth middleware.
        // It supports different token shapes: _id, id, or userId.
        const userId = req.user?._id || req.user?.id || req.user?.userId || null; // Pick the first available identifier or null if none exist.

        console.log(`Adding upload job to queue for user ${userId}, title: ${title}`); // Log that a new job is being enqueued for traceability.
        console.log(`req.user structure:`, JSON.stringify(req.user, null, 2)); // Log the shape of req.user for debugging token/role issues.

        // If there was no valid user ID on the request, treat this as unauthorized.
        if (!userId) {
            return res.status(401).json({
                success: false, // Indicate failure due to missing authentication context.
                message: "User ID not found in token", // Clarify that the token did not contain a usable user ID.
            });
        }

        // Enqueue the upload job onto the "music-upload" BullMQ queue for asynchronous processing by the worker.
        const job = await uploadQueue.add(
            "uploadMusicJob", // Name of the job type; used by workers to route processing logic.
            {
                musicBuffer: musicBufferBase64, // Base64 string for the music file content.
                musicName: musicFile.originalname, // Original filename of the uploaded music file.
                imageBuffer: imageBufferBase64, // Base64 string for the image file content.
                imageName: imageFile.originalname, // Original filename of the uploaded image file.
                userId: userId.toString(), // Stringified user ID so MongoDB can use it as ObjectId.
                title, // Track title from the request body.
                album: album || null, // Optional album ID or null if not provided.
            },
            {
                attempts: 3, // Let BullMQ automatically retry this job up to 3 times on failure.
                priority: 1, // Give this job a high priority value (1 is highest, 0 is default) so it is processed quickly.
            }
        );

        console.log(`Job ${job.id} added to queue successfully`); // Log that the job was enqueued successfully and include its queue ID.

        // Respond to the client immediately without waiting for uploads/DB work to finish.
        res.status(202).json({
            success: true, // Indicate that the job was accepted for processing.
            message: "Music upload started. Processing...", // Explain that the upload will continue in the background.
            jobId: job.id, // Return the job ID so the client could later query status if desired.
        });
    } catch (error) { // Handle unexpected errors in the controller (validation, queue, etc.).
        console.error("Upload error:", error); // Log the underlying error for server-side debugging.
        res.status(400).json({
            success: false, // Indicate that the upload request failed.
            message: error.message, // Expose the error message; in a real system you might sanitize this.
        });
    }
};

// Export the upload controller so routes can attach it to endpoints.
export {
    uploadMusic, // Export the asynchronous upload controller used in /api/music/upload.
};