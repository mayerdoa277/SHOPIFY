import playlistModel from "../models/playlist.model.js";
import musicModel from "../models/music.model.js";
import userModel from "../models/user.model.js";
import { uploadMusicImage } from "../service/upload.service.js";

// create playlist (user & artist both can create)
const createPlaylist = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;
        const { title, description, musics } = req.body;
        const files = req.files;

        // Validate required fields
        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Playlist title is required",
            });
        }

        // Handle cover image upload to ImageKit
        let coverImage = null;
        if (files && files.coverImage && files.coverImage.length > 0) {
            const coverImageFile = files.coverImage[0];
            const imageResult = await uploadMusicImage(
                coverImageFile.buffer, 
                `playlist-cover-${title}-${Date.now()}.jpg`
            );
            
            if (imageResult && imageResult.url) {
                coverImage = imageResult.url;
                console.log(`✅ Playlist cover uploaded to ImageKit: ${imageResult.url}`);
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Failed to upload cover image to ImageKit",
                });
            }
        }

        // Parse musics array
        let musicIds = [];
        if (musics) {
            if (typeof musics === 'string') {
                musicIds = JSON.parse(musics);
            } else if (Array.isArray(musics)) {
                musicIds = musics;
            }
        }

        // Validate musics exist
        if (musicIds.length > 0) {
            const validMusics = await musicModel.find({ _id: { $in: musicIds } });
            if (validMusics.length !== musicIds.length) {
                return res.status(400).json({
                    success: false,
                    message: "Some music IDs are invalid",
                });
            }
        }

        // Create playlist
        const playlist = await playlistModel.create({
            title,
            description: description || "",
            coverImage,
            musics: musicIds,
            creator: userId,
            isPublic: false // Default private
        });

        // Populate creator info
        await playlist.populate("creator", "username email profile.firstName profile.lastName");

        res.status(201).json({
            success: true,
            message: "Playlist created successfully",
            playlist,
        });
    } catch (error) {
        console.error("Error creating playlist:", error);
        res.status(500).json({
            success: false,
            message: "Playlist creation failed: " + error.message,
        });
    }
};

// get all public playlists
const getAllPlaylists = async (req, res) => {
    try {
        const playlists = await playlistModel.find({ isPublic: true })
            .populate("creator", "username profile.firstName profile.lastName")
            .populate("musics", "title uri image artist")
            .populate("musics.artist", "username");

        return res.status(200).json({
            success: true,
            message: "Public playlists fetched successfully",
            playlists,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch playlists: " + error.message,
        });
    }
};

// get user's own playlists
const getUserPlaylists = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;
        
        const playlists = await playlistModel.find({ creator: userId })
            .populate("musics", "title uri image artist")
            .populate("musics.artist", "username");

        return res.status(200).json({
            success: true,
            message: "User playlists fetched successfully",
            playlists,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user playlists: " + error.message,
        });
    }
};

// get artist's playlists
const getArtistPlaylists = async (req, res) => {
    try {
        const artistId = req.params.id;
        
        const playlists = await playlistModel.find({ creator: artistId })
            .populate("musics", "title uri image artist createdAt")
            .populate("musics.artist", "username profile.firstName profile.lastName");

        return res.status(200).json({
            success: true,
            message: "Artist playlists fetched successfully",
            playlists,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch artist playlists: " + error.message,
        });
    }
};

// get playlist by id
const getPlaylistById = async (req, res) => {
    try {
        const playlistId = req.params.id;
        const userId = req.user.id || req.user._id || req.user.userId;
        const userRole = req.user.role;

        const playlist = await playlistModel.findById(playlistId)
            .populate("creator", "username profile.firstName profile.lastName")
            .populate("musics", "title uri image artist createdAt")
            .populate("musics.artist", "username profile.firstName profile.lastName");

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist not found",
            });
        }

        // Check access: public playlist OR owner OR admin
        if (!playlist.isPublic && 
            playlist.creator._id.toString() !== userId.toString() && 
            userRole !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You don't have access to this playlist",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Playlist fetched successfully",
            playlist,
        });
    } catch (error) {
        console.error("Error fetching playlist:", error);
        return res.status(500).json({
            success: false,
            message: "Playlist fetch failed: " + error.message,
        });
    }
};

// update playlist
const updatePlaylist = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;
        const userRole = req.user.role;
        const playlistId = req.params.id;
        const { title, description, musics, isPublic } = req.body;
        const files = req.files;

        // Find playlist first
        const playlist = await playlistModel.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist not found",
            });
        }

        // Check ownership
        if (userRole !== "admin" && playlist.creator.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own playlists",
            });
        }

        // Prepare update data
        const updateData = {};

        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (isPublic !== undefined) updateData.isPublic = isPublic;

        // Handle cover image update
        if (files && files.coverImage && files.coverImage.length > 0) {
            updateData.coverImage = `/uploads/${files.coverImage[0].originalname}`;
        }

        // Handle musics update
        if (musics !== undefined) {
            let musicIds = [];
            if (typeof musics === 'string') {
                musicIds = JSON.parse(musics);
            } else if (Array.isArray(musics)) {
                musicIds = musics;
            }

            // Validate musics exist
            if (musicIds.length > 0) {
                const validMusics = await musicModel.find({ _id: { $in: musicIds } });
                if (validMusics.length !== musicIds.length) {
                    return res.status(400).json({
                        success: false,
                        message: "Some music IDs are invalid",
                    });
                }
            }

            updateData.musics = musicIds;
        }

        // Update playlist
        const updatedPlaylist = await playlistModel.findByIdAndUpdate(
            playlistId,
            updateData,
            { new: true, runValidators: true }
        ).populate("musics", "title uri image artist")
         .populate("musics.artist", "username");

        return res.status(200).json({
            success: true,
            message: "Playlist updated successfully",
            playlist: updatedPlaylist,
        });
    } catch (error) {
        console.error("Error updating playlist:", error);
        return res.status(500).json({
            success: false,
            message: "Playlist update failed: " + error.message,
        });
    }
};

// delete playlist
const deletePlaylist = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;
        const userRole = req.user.role;
        const playlistId = req.params.id;

        // Find playlist first
        const playlist = await playlistModel.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist not found",
            });
        }

        // Check ownership
        if (userRole !== "admin" && playlist.creator.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own playlists",
            });
        }

        // Delete playlist
        await playlistModel.findByIdAndDelete(playlistId);

        return res.status(200).json({
            success: true,
            message: "Playlist deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting playlist:", error);
        return res.status(500).json({
            success: false,
            message: "Playlist deletion failed: " + error.message,
        });
    }
};

// add music to playlist
const addMusicToPlaylist = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;
        const userRole = req.user.role;
        const { playlistId, musicId } = req.body;

        // Find playlist
        const playlist = await playlistModel.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist not found",
            });
        }

        // Check ownership
        if (userRole !== "admin" && playlist.creator.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only modify your own playlists",
            });
        }

        // Check if music exists
        const music = await musicModel.findById(musicId);
        if (!music) {
            return res.status(404).json({
                success: false,
                message: "Music not found",
            });
        }

        // Check if music already in playlist
        if (playlist.musics.includes(musicId)) {
            return res.status(400).json({
                success: false,
                message: "Music already in playlist",
            });
        }

        // Add music to playlist
        playlist.musics.push(musicId);
        await playlist.save();

        await playlist.populate("musics", "title uri image artist")
                     .populate("musics.artist", "username");

        return res.status(200).json({
            success: true,
            message: "Music added to playlist successfully",
            playlist,
        });
    } catch (error) {
        console.error("Error adding music to playlist:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to add music to playlist: " + error.message,
        });
    }
};

// remove music from playlist
const removeMusicFromPlaylist = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;
        const userRole = req.user.role;
        const { playlistId, musicId } = req.body;

        // Find playlist
        const playlist = await playlistModel.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist not found",
            });
        }

        // Check ownership
        if (userRole !== "admin" && playlist.creator.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only modify your own playlists",
            });
        }

        // Remove music from playlist
        playlist.musics = playlist.musics.filter(music => music.toString() !== musicId);
        await playlist.save();

        await playlist.populate("musics", "title uri image artist")
                     .populate("musics.artist", "username");

        return res.status(200).json({
            success: true,
            message: "Music removed from playlist successfully",
            playlist,
        });
    } catch (error) {
        console.error("Error removing music from playlist:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to remove music from playlist: " + error.message,
        });
    }
};

export {
    createPlaylist,
    getAllPlaylists,
    getUserPlaylists,
    getArtistPlaylists,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addMusicToPlaylist,
    removeMusicFromPlaylist
};
