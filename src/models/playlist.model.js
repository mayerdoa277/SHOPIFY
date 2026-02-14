import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Playlist title is required"],
        trim: true,
        maxlength: [100, "Playlist title cannot exceed 100 characters"]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"],
        default: ""
    },
    coverImage: {
        type: String,
        default: null
    },
    musics: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Music"
    }],
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Playlist creator is required"]
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    playCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for better performance
playlistSchema.index({ creator: 1 });
playlistSchema.index({ isPublic: 1 });
playlistSchema.index({ createdAt: -1 });

export default mongoose.model("Playlist", playlistSchema);
