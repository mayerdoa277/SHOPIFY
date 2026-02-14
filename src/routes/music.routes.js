import express from "express"; // Import Express to create a router instance for music-related endpoints.
import { body } from "express-validator"; // Import express-validator for validation
import { upload } from "../config/multer.config.js"; // Import the configured Multer instance that handles file uploads.
import { uploadMusic } from "../controllers/music.controller.js"; // Import the controller function that enqueues music upload jobs.
import { getAllMusics, getMusicById, updateMusic, getArtistMusic } from "../controllers/music.controller.js"; // Import the controller function that gets all musics.
import { createAlbum, getAllAlbum, getArtistAlbum, deleteAlbum, getAlbumById, updateAlbum } from "../controllers/album.controller.js"; // Import the controller function that creates albums.
import { artistAuth, userAuth, authenticateUser } from "../middleware/auth.middleware.js"; // Import middleware that ensures only authenticated artists can access these routes.

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
 * Create album with existing music and/or new music files
 * POST /api/music/createAlbum
 * 
 * Form data (recommended):
 * Content-Type: multipart/form-data
 * title: "Album Title"
 * musics: ["music_id_1"] (optional, as JSON string for existing music)
 * musics: [file1.mp3, file2.mp3] (optional, for new music uploads)
 * coverImage: [cover.jpg] (required, uploaded from phone/PC)
 */
router.post("/createAlbum", artistAuth, upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "musics", maxCount: 10 }
]), createAlbum); // Define a POST route on this router for creating albums. 

// GET /api/music/
// geting all musics
router.get("/", getAllMusics); // Define a GET route on this router for getting all musics.

// GET /api/music/albums
// geting all albums (public access)
router.get("/albums", getAllAlbum); // Define a GET route on this router for getting all albums.

// GET /api/music/albums/:id
// get album by id (public access for users, full access for artists/admins)
router.get("/albums/:id", userAuth, getAlbumById); // Define a GET route for getting specific album by id (all authenticated users)

// only artist can access this route
// GET /api/music/artistAlbums
// geting logged in artist albums
router.get("/artistAlbums", artistAuth, getArtistAlbum); // Define a GET route on this router for getting artist albums.

// GET /api/music/artistMusics
// geting logged in artist musics (admin can access any artist)
router.get("/artistMusics", artistAuth, getArtistMusic); // Define a GET route for getting artist musics.

// GET /api/music/:id
// get music by id (all authenticated users can access)
router.get("/:id", getMusicById); // Define a GET route for getting specific music by id

// PUT /api/music/:id
// update music (admin can update any music)
router.put("/:id", artistAuth, upload.fields([
    { name: "image", maxCount: 1 }
]), updateMusic); // Define a PUT route on this router for updating a music.

// PUT /api/music/albums/:id
// update album title and coverImage (artist can update own album, admin can update any album)
router.put("/albums/:id", artistAuth, upload.fields([
    { name: "coverImage", maxCount: 1 }
]), updateAlbum); // Define a PUT route for updating albums (title and coverImage only)

// DELETE /api/music/albums/:id
// delete album (artist can delete own album, admin can delete any album)
router.delete("/albums/:id", artistAuth, deleteAlbum); // Define a DELETE route for deleting albums.

export default router; // Export the configured router so it can be mounted onto the main Express app.