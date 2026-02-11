import express from "express";
import { upload } from "../config/multer.config.js";
import { uploadMusic } from "../controllers/music.controller.js";
// import { authUser, authArtist } from "../middleware/auth.js";

const router = express.Router();

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
router.post(
    "/upload",
    upload.fields([
        { name: "music", maxCount: 1 },
        { name: "image", maxCount: 1 },
    ]),
    uploadMusic
);

export default router;