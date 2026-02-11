import musicModel from "../models/music.model.js";
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

        // const user = req.body.userId || req.user?._id || null;

        // Add job to queue for background processing
        // Convert buffers to base64 strings for BullMQ serialization
        const musicBufferBase64 = musicFile.buffer.toString('base64');
        const imageBufferBase64 = imageFile.buffer.toString('base64');
        
        // Get userId from JWT token (could be _id or id or userId)
        const userId = req.user?._id || req.user?.id || req.user?.userId || null;
        
        console.log(`Adding upload job to queue for user ${userId}, title: ${title}`);
        console.log(`req.user structure:`, JSON.stringify(req.user, null, 2));
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID not found in token",
            });
        }
        
        const job = await uploadQueue.add(
            "uploadMusicJob",
            {
                musicBuffer: musicBufferBase64,
                musicName: musicFile.originalname,
                imageBuffer: imageBufferBase64,
                imageName: imageFile.originalname,
                userId: userId.toString(),
                title,
                album: album || null,
            },
            {
                attempts: 3,
                priority: 1,
            }
        );

        console.log(`Job ${job.id} added to queue successfully`);

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

const c = async (req, res) => {};

export {
    createMusic,
    uploadMusic,
};