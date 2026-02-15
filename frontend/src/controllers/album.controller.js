import albumModel from "../models/album.model.js";
import musicModel from "../models/music.model.js";
import { uploadMusicImage, uploadMusicFile } from "../service/upload.service.js";

const createAlbum = async (req, res) => {
    try {
        const { title, musics } = req.body;
        const files = req.files;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title is required",
            });
        }

        // Handle cover image upload to ImageKit
        let finalCoverImage;
        if (files && files.coverImage && files.coverImage.length > 0) {
            const coverImageFile = files.coverImage[0];
            const imageResult = await uploadMusicImage(
                coverImageFile.buffer, 
                `album-cover-${title}-${Date.now()}.jpg`
            );
            
            if (imageResult && imageResult.url) {
                finalCoverImage = imageResult.url;
                console.log(`✅ Album cover uploaded to ImageKit: ${imageResult.url}`);
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Failed to upload cover image to ImageKit",
                });
            }
        }

        if (!finalCoverImage) {
            return res.status(400).json({
                success: false,
                message: "Cover image file is required",
            });
        }

        // Parse musics from req.body (it might be a string if coming from form data)
        let existingMusics = [];
        if (musics) {
            if (typeof musics === 'string') {
                existingMusics = JSON.parse(musics);
            } else if (Array.isArray(musics)) {
                existingMusics = musics;
            }
        }

        // Create new music entries from uploaded files
        let newMusicIds = [];
        if (files && files.musics && files.musics.length > 0) {
            for (const musicFile of files.musics) {
                // Upload music file to ImageKit
                const musicResult = await uploadMusicFile(
                    musicFile.buffer, 
                    musicFile.originalname
                );
                
                if (musicResult && musicResult.url) {
                    const newMusic = await musicModel.create({
                        title: musicFile.originalname,
                        uri: musicResult.url, // Now using ImageKit URL
                        image: finalCoverImage,
                        artist: req.user.id || req.user._id || req.user.userId,
                    });
                    newMusicIds.push(newMusic._id);
                    console.log(`✅ Music file uploaded to ImageKit: ${musicResult.url}`);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: "Failed to upload music file to ImageKit",
                    });
                }
            }
        }

        // Combine existing and new music IDs as per schema
        const allMusics = [...existingMusics, ...newMusicIds];

        // Validate that at least one music is provided
        if (allMusics.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one music is required (existing ID or uploaded file)",
            });
        }

        // Create album with combined musics array
        const album = await albumModel.create({
            title,
            coverImage: finalCoverImage,
            musics: allMusics,
            artist: req.user.id || req.user._id || req.user.userId,
        });

        res.status(201).json({
            success: true,
            message: "Album created successfully",
            album,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// get all albums form all artist 
const getAllAlbum = async (req, res) => {
    try {
        const albums = await albumModel.find()
            .populate("artist", "username email");

        return res.status(200).json({
            success: true,
            message: "fetch all albums successfully",
            albums,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "fetch all albums failed" + error.message,
        });
    }
};

// get album by id
const getAlbumById = async (req, res) => {
    try {
        const albumId = req.params.id;
        const userId = req.user.id || req.user._id || req.user.userId;
        const userRole = req.user.role;

        const album = await albumModel.findById(albumId)
            .populate("artist", "username profile.firstName profile.lastName")
            .populate("musics", "title uri image createdAt");

        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found",
            });
        }

        if (userRole !== "admin" && album.artist.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this album",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Album fetched successfully",
            album,
        });
    } catch (error) {
        console.error("Error fetching album:", error);
        return res.status(500).json({
            success: false,
            message: "Album fetch failed: " + error.message,
        });
    }
};

// get logged in artist albums (admin can access any artist's albums)
const getArtistAlbum = async (req, res) => {
    const artistId = req.user.id || req.user._id || req.user.userId;

    // Allow admin to access any artist's albums
    if (req.user.role !== "artist" && req.user.role !== "admin") {
        return res.status(401).json({
            success: false,
            message: "Unauthorized - Artist or Admin access required",
        });
    }

    // Admin can get any artist's albums, artists can only get their own
    const targetArtistId = req.user.role === "admin" ?
        (req.query.artistId || artistId) : artistId;

    const albums = await albumModel.find({ artist: targetArtistId });

    return res.status(200).json({
        success: true,
        message: "fetch artist albums successfully",
        albums,
    });
}

// delete artist album
const deleteAlbum = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;
        const userRole = req.user.role;
        const albumId = req.params.id;

        // Check if user is artist or admin
        if (userRole !== "artist" && userRole !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Unauthorized - Artist or Admin access required",
            });
        }

        // Find the album first to check ownership
        const album = await albumModel.findById(albumId);
        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found",
            });
        }

        // Delete the album
        const deletedAlbum = await albumModel.findByIdAndDelete(albumId);

        // Optionally: Remove album reference from music files
        await musicModel.updateMany(
            { album: albumId },
            { $pull: { album: albumId } }
        );

        return res.status(200).json({
            success: true,
            message: "Album deleted successfully",
            album: deletedAlbum,
        });
    } catch (error) {
        console.error("Error deleting album:", error);
        return res.status(500).json({
            success: false,
            message: "Album deletion failed: " + error.message,
        });
    }
};

// update album (title and coverImage only)
const updateAlbum = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;
        const userRole = req.user.role;
        const albumId = req.params.id;
        const { title } = req.body;
        const files = req.files;

        // Find album first to check ownership
        const album = await albumModel.findById(albumId);
        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found",
            });
        }

        // Check ownership
        if (userRole !== "admin" && album.artist.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own albums",
            });
        }

        // Prepare update data
        const updateData = {};

        // Update title if provided
        if (title) {
            updateData.title = title;
        }

        // Handle cover image update
        if (files && files.coverImage && files.coverImage.length > 0) {
            const coverImageFile = files.coverImage[0];
            const imageResult = await uploadMusicImage(
                coverImageFile.buffer, 
                `album-cover-${title}-${Date.now()}.jpg`
            );
            
            if (imageResult && imageResult.url) {
                updateData.coverImage = imageResult.url;
                console.log(`✅ Album cover updated to ImageKit: ${imageResult.url}`);
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Failed to upload cover image to ImageKit",
                });
            }
        }

        // Update album (no music changes)
        const updatedAlbum = await albumModel.findByIdAndUpdate(
            albumId,
            updateData,
            { new: true, runValidators: true }
        ).populate("musics", "title uri image createdAt");

        return res.status(200).json({
            success: true,
            message: "Album updated successfully",
            album: updatedAlbum,
        });
    } catch (error) {
        console.error("Error updating album:", error);
        return res.status(500).json({
            success: false,
            message: "Album update failed: " + error.message,
        });
    }
};

export {
    createAlbum,
    getAllAlbum,
    getAlbumById,
    getArtistAlbum,
    deleteAlbum,
    updateAlbum
}; 