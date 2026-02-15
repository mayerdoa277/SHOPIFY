import express from 'express';
import {
    getProfile,
    updateProfile,
    updateArtistProfile,
    getPublicProfile,
    uploadAvatar,
    updatePreferences,
    followUser,
    getArtists
} from '../controllers/profile.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { upload } from '../config/multer.config.js';

const router = express.Router();

// Get current user profile (protected)
router.get('/profile', authenticateUser, getProfile);

// Update basic profile (protected)
router.put('/profile', authenticateUser, updateProfile);

// Update artist profile (protected, artists only)
router.put('/artist-profile', authenticateUser, updateArtistProfile);

// Upload avatar (protected)
router.post('/avatar', authenticateUser, upload.single('avatar'), uploadAvatar);

// Update preferences (protected)
router.put('/preferences', authenticateUser, updatePreferences);

// Get public profile by username (public)
router.get('/public/:username', getPublicProfile);

// Follow/Unfollow user (protected)
router.post('/follow/:userIdToFollow', authenticateUser, followUser);

// Get artists list (public with pagination)
router.get('/artists', getArtists);

export default router;
