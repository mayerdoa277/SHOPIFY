import musicModel from "../models/music.model.js";
import userModel from "../models/user.model.js";
import { uploadQueue } from "../config/queue.js";

const createMusic = async (req, res) => {
    try {
        const { image, title, uri, album } = req.body || req.headers["authorization"].split(" ")[1];

        const music = await musicModel.create({
            image,
            title,
            uri,
            album: album || null,
            artist: req.user._id,
        });

        // If album ID is provided, add music to that album's musics array
        if (album) {
            await albumModel.findByIdAndUpdate(
                album,
                {
                    $push: {
                        musics: music._id
                    }
                },
                { new: true }
            );
        }

        res
            .status(201)
            .json({
                success: true,
                message: "Music created successfully",
                music
            });
    } catch (error) {
        console.error("Error creating music:", error);

        res
            .status(500)
            .json({
                success: false,
                message: "Server error"
            });
    }
};

/**
 * Upload music with image to ImageKit and save to database
 * POST /api/music/upload
 * 
 * Form data:
 * - music: audio file (required)
 * - image: image file (required)
 * - title: string (required)
 * - album: album ID (optional)
 */
const uploadMusic = async (req, res) => {
    try {
        console.log("[uploadMusic] Incoming request");
        console.log("[uploadMusic] req.body:", req.body);
        console.log("[uploadMusic] req.files keys:", Object.keys(req.files || {}));

        const musicFile = req.files?.music?.[0];
        const imageFile = req.files?.image?.[0];
        const { title, album } = req.body;

        // Validation
        if (!musicFile) {
            return res.status(400).json({
                success: false,
                message: "Music file required",
            });
        }

        if (!imageFile) {
            return res.status(400).json({
                success: false,
                message: "Image file required",
            });
        }

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title required",
            });
        }

        const user = req.body.userId || req.user?._id || null;
        console.log("[uploadMusic] Resolved user ID:", user);

        // Add job to queue for background processing
        console.log("[uploadMusic] Adding job to uploadQueue...");
        const job = await uploadQueue.add(
            "uploadMusicJob",
            {
                musicBuffer: musicFile.buffer,
                musicName: musicFile.originalname,
                imageBuffer: imageFile.buffer,
                imageName: imageFile.originalname,
                userId: user,
                title,
                album: album || null,
            },
            {
                attempts: 3,
                priority: 1,
            }
        );
        console.log("[uploadMusic] Job added to queue with ID:", job.id);

        res.status(202).json({
            success: true,
            message: "Music upload started. Processing...",
            jobId: job.id,
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export {
    createMusic,
    uploadMusic,
};