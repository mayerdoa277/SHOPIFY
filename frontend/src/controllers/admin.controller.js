import userModel from "../models/user.model.js";
import musicModel from "../models/music.model.js";
import albumModel from "../models/album.model.js";

// Get all users with pagination and filtering
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, role, search, isActive } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (role) filter.role = role;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { 'profile.firstName': { $regex: search, $options: 'i' } },
                { 'profile.lastName': { $regex: search, $options: 'i' } }
            ];
        }

        const users = await userModel.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await userModel.countDocuments(filter);

        res.status(200).json({
            success: true,
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await userModel.findById(userId)
            .select('-password')
            .populate('following', 'username profile.firstName profile.lastName')
            .populate('followers', 'username profile.firstName profile.lastName');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Update user role
const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['user', 'artist', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User role updated successfully",
            user
        });
    } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Ban/Unban user
const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        const user = await userModel.findByIdAndUpdate(
            userId,
            { isActive },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: `User ${isActive ? 'activated' : 'banned'} successfully`,
            user
        });
    } catch (error) {
        console.error("Error toggling user status:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Don't allow admin to delete themselves
        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own account"
            });
        }

        const user = await userModel.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Also delete user's music and albums
        await musicModel.deleteMany({ artist: userId });
        await albumModel.deleteMany({ artist: userId });

        res.status(200).json({
            success: true,
            message: "User and all associated data deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await userModel.countDocuments();
        const activeUsers = await userModel.countDocuments({ isActive: true });
        const totalArtists = await userModel.countDocuments({ role: 'artist' });
        const totalAdmins = await userModel.countDocuments({ role: 'admin' });
        const totalMusic = await musicModel.countDocuments();
        const totalAlbums = await albumModel.countDocuments();

        // Recent registrations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentUsers = await userModel.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Users by role
        const usersByRole = await userModel.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                totalArtists,
                totalAdmins,
                totalMusic,
                totalAlbums,
                recentUsers,
                usersByRole
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get all music with artist info
const getAllMusic = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, artist } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { 'artist.username': { $regex: search, $options: 'i' } }
            ];
        }
        if (artist) filter.artist = artist;

        const music = await musicModel.find(filter)
            .populate('artist', 'username profile.firstName profile.lastName')
            .populate('album', 'title')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await musicModel.countDocuments(filter);

        res.status(200).json({
            success: true,
            music,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching music:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Delete music
const deleteMusic = async (req, res) => {
    try {
        const { musicId } = req.params;

        const music = await musicModel.findByIdAndDelete(musicId);

        if (!music) {
            return res.status(404).json({
                success: false,
                message: "Music not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Music deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting music:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Verify artist
const verifyArtist = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isVerified } = req.body;

        const user = await userModel.findByIdAndUpdate(
            userId,
            { 'artistProfile.isVerified': isVerified },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user || user.role !== 'artist') {
            return res.status(404).json({
                success: false,
                message: "Artist not found"
            });
        }

        res.status(200).json({
            success: true,
            message: `Artist ${isVerified ? 'verified' : 'unverified'} successfully`,
            user
        });
    } catch (error) {
        console.error("Error verifying artist:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

export {
    getAllUsers,
    getUserById,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    getDashboardStats,
    getAllMusic,
    deleteMusic,
    verifyArtist
};
