import express from "express";
import { body } from "express-validator";
import { upload } from "../config/multer.config.js";
import { 
    createPlaylist, 
    getAllPlaylists, 
    getUserPlaylists, 
    getArtistPlaylists,
    getPlaylistById, 
    updatePlaylist, 
    deletePlaylist,
    addMusicToPlaylist,
    removeMusicFromPlaylist
} from "../controllers/playlist.controller.js";
import { authenticateUser, userAuth, artistAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * Create playlist (user & artist both can create)
 * POST /api/playlist/create
 * 
 * Form data:
 * - title: "My Playlist"
 * - description: "My favorite songs" (optional)
 * - musics: ["music_id_1", "music_id_2"] (optional)
 * - coverImage: [image_file] (optional)
 */
router.post("/create", authenticateUser, upload.fields([
    { name: "coverImage", maxCount: 1 }
]), createPlaylist);

/**
 * Get all public playlists
 * GET /api/playlist/public
 * Anyone can access public playlists
 */
router.get("/public", getAllPlaylists);

/**
 * Get user's own playlists
 * GET /api/playlist/my
 * User & Artist can access their own playlists
 */
router.get("/my", authenticateUser, getUserPlaylists);

/**
 * Get artist's playlists
 * GET /api/playlist/artist/:id
 * Anyone can access artist's playlists
 */
router.get("/artist/:id", authenticateUser, getArtistPlaylists);

/**
 * Get playlist by id
 * GET /api/playlist/:id
 * Public playlists: anyone can access
 * Private playlists: only owner & admin can access
 */
router.get("/:id", authenticateUser, getPlaylistById);

/**
 * Update playlist
 * PUT /api/playlist/:id
 * Only playlist owner & admin can update
 */
router.put("/:id", authenticateUser, upload.fields([
    { name: "coverImage", maxCount: 1 }
]), updatePlaylist);

/**
 * Delete playlist
 * DELETE /api/playlist/:id
 * Only playlist owner & admin can delete
 */
router.delete("/:id", authenticateUser, deletePlaylist);

/**
 * Add music to playlist
 * POST /api/playlist/add-music
 * Only playlist owner & admin can modify
 */
router.post("/add-music", authenticateUser, addMusicToPlaylist);

/**
 * Remove music from playlist
 * POST /api/playlist/remove-music
 * Only playlist owner & admin can modify
 */
router.post("/remove-music", authenticateUser, removeMusicFromPlaylist);

export default router;
