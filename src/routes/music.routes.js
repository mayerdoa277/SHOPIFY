import express from "express"; // Import Express to create a router instance for music-related endpoints.
import { upload } from "../config/multer.config.js"; // Import the configured Multer instance that handles file uploads.
import { uploadMusic } from "../controllers/music.controller.js"; // Import the controller function that enqueues music upload jobs.
import { artistAuth } from "../middleware/auth.middleware.js"; // Import middleware that ensures only authenticated artists can access these routes.

const router = express.Router(); // Create a new router object for defining music routes.

/**
 * Upload music with image
 * POST /api/music/upload
 * 
 * Form data:
 * - music: [audio file]
 * - image: [image file]
 * - title: "Song Title"
 * - album: "album-id" (optional)
 */
router.post( // Define a POST route on this router for handling uploads.
    "/upload", // Route path relative to the router's mount path; full path might be /api/music/upload.
    artistAuth, // First, run artistAuth to verify the requester is an authenticated artist.
    upload.fields([ // Next, use Multer to parse multipart form data containing named file fields.
        { name: "music", maxCount: 1 }, // Expect one file under the "music" field (audio file).
        { name: "image", maxCount: 1 }, // Expect one file under the "image" field (cover image).
    ]),
    uploadMusic // Finally, hand over to the uploadMusic controller, which validates and enqueues the job.
);

export default router; // Export the configured router so it can be mounted onto the main Express app.