import userModel from "../models/user.model.js";

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId)
            .select('-password')
            .populate('following', 'username profile.avatar profile.firstName')
            .populate('followers', 'username profile.avatar profile.firstName');

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
        console.error("Error fetching profile:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Update basic profile (for all users)
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const allowedUpdates = [
            'profile.firstName',
            'profile.lastName', 
            'profile.bio',
            'profile.dateOfBirth',
            'profile.location',
            'profile.website',
            'profile.socialLinks'
        ];

        const updateData = {};
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updateData[key] = req.body[key];
            }
        });

        const user = await userModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Update artist profile (only for artists)
const updateArtistProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Check if user is an artist
        const user = await userModel.findById(userId);
        if (!user || user.role !== 'artist') {
            return res.status(403).json({
                success: false,
                message: "Only artists can update artist profile"
            });
        }

        const allowedUpdates = [
            'artistProfile.genre',
            'artistProfile.bandName',
            'artistProfile.yearsActive',
            'artistProfile.label',
            'artistProfile.influences',
            'artistProfile.equipment',
            'artistProfile.achievements'
        ];

        const updateData = {};
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updateData[key] = req.body[key];
            }
        });

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: "Artist profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error updating artist profile:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get public profile by username
const getPublicProfile = async (req, res) => {
    try {
        const { username } = req.params;
        
        const user = await userModel.findOne({ username })
            .select('-password -preferences.notificationSettings -preferences.privacy')
            .populate('following', 'username profile.avatar profile.firstName')
            .populate('followers', 'username profile.avatar profile.firstName');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Apply privacy settings
        const publicUser = { ...user.toObject() };
        if (user.preferences.privacy.showEmail === false) {
            delete publicUser.email;
        }
        if (user.preferences.privacy.showLocation === false) {
            delete publicUser.profile.location;
        }

        res.status(200).json({
            success: true,
            user: publicUser
        });
    } catch (error) {
        console.error("Error fetching public profile:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Upload profile avatar
const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.id;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        const avatarUrl = req.file.path; // Assuming you're using multer or similar

        const user = await userModel.findByIdAndUpdate(
            userId,
            { 'profile.avatar': avatarUrl },
            { new: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: "Avatar uploaded successfully",
            user
        });
    } catch (error) {
        console.error("Error uploading avatar:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Update user preferences
const updatePreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const allowedUpdates = [
            'preferences.favoriteGenres',
            'preferences.notificationSettings',
            'preferences.privacy'
        ];

        const updateData = {};
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updateData[key] = req.body[key];
            }
        });

        const user = await userModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: "Preferences updated successfully",
            user
        });
    } catch (error) {
        console.error("Error updating preferences:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Follow/Unfollow user (for artists)
const followUser = async (req, res) => {
    try {
        const followerId = req.user.id;
        const { userIdToFollow } = req.params;

        if (followerId === userIdToFollow) {
            return res.status(400).json({
                success: false,
                message: "You cannot follow yourself"
            });
        }

        const userToFollow = await userModel.findById(userIdToFollow);
        if (!userToFollow) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const currentUser = await userModel.findById(followerId);
        const isFollowing = currentUser.following.includes(userIdToFollow);

        if (isFollowing) {
            // Unfollow
            currentUser.following.pull(userIdToFollow);
            userToFollow.followers.pull(followerId);
            userToFollow.artistProfile.followerCount -= 1;
        } else {
            // Follow
            currentUser.following.push(userIdToFollow);
            userToFollow.followers.push(followerId);
            userToFollow.artistProfile.followerCount += 1;
        }

        await currentUser.save();
        await userToFollow.save();

        res.status(200).json({
            success: true,
            message: isFollowing ? "Unfollowed successfully" : "Followed successfully",
            following: !isFollowing
        });
    } catch (error) {
        console.error("Error following user:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get artists list
const getArtists = async (req, res) => {
    try {
        const { page = 1, limit = 10, genre } = req.query;
        const skip = (page - 1) * limit;

        const filter = { role: 'artist' };
        if (genre) {
            filter['artistProfile.genre'] = genre;
        }

        const artists = await userModel.find(filter)
            .select('username profile.avatar profile.firstName profile.lastName artistProfile.genre artistProfile.bandName artistProfile.isVerified artistProfile.followerCount')
            .sort({ 'artistProfile.followerCount': -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await userModel.countDocuments(filter);

        res.status(200).json({
            success: true,
            artists,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching artists:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

export {
    getProfile,
    updateProfile,
    updateArtistProfile,
    getPublicProfile,
    uploadAvatar,
    updatePreferences,
    followUser,
    getArtists
};
