import express from "express"; // Import Express to create a router instance for music-related endpoints.
import { body, query } from "express-validator"; // Import express-validator for validation
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
    [
        // Validate form fields (body parameters) - matching music schema
        body('title').notEmpty().withMessage('Title is required'),
        body('title').isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
        body('album').optional().isMongoId().withMessage('Invalid album ID format')
    ],
    upload.fields([ // Next, use Multer to parse multipart form data containing named file fields.
        { name: "music", maxCount: 1 }, // Expect one file under the "music" field (audio file).
        { name: "image", maxCount: 1 }, // Expect one file under the "image" field (cover image).
    ]),
    uploadMusic // Finally, hand over to the uploadMusic controller, which validates and enqueues the job.
);

/**
 * Get music list with query parameters
 * GET /api/music?page=1&limit=10&genre=rock&search=song
 */
// router.get('/', [
//     query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
//     query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
//     query('genre').optional().isAlpha().withMessage('Genre must contain only letters'),
//     query('search').optional().isLength({ min: 2, max: 50 }).withMessage('Search term must be between 2 and 50 characters')
// ], getAllUsers); // Replace with actual controller function

export default router; // Export the configured router so it can be mounted onto the main Express app.