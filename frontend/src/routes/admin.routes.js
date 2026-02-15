import express from 'express';
import {
    getAllUsers,
    getUserById,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    getDashboardStats,
    getAllMusic,
    deleteMusic,
    verifyArtist
} from '../controllers/admin.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

// Admin only middleware
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }
    next();
};

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticateUser, adminOnly);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId/role', updateUserRole);
router.put('/users/:userId/status', toggleUserStatus);
router.delete('/users/:userId', deleteUser);

// Artist management
router.put('/artists/:userId/verify', verifyArtist);

// Content management
router.get('/music', getAllMusic);
router.delete('/music/:musicId', deleteMusic);

export default router;
