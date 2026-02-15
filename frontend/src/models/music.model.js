import mongoose, { Schema, model } from "mongoose";

const musicSchema = new Schema(
    {
        image: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        uri: {
            type: String,
            required: true,
        },
        artist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        album: {
            type: [mongoose.Schema.Types.ObjectId],  // ✅ Array of albums
            ref: "Album",
            default: []
        }
    },
    {
        timestamps: true,
    }
);

// Add indexes for better performance
musicSchema.index({ artist: 1 });
musicSchema.index({ album: 1 });
musicSchema.index({ title: "text" });
musicSchema.index({ createdAt: -1 });

const musicModel = model("Music", musicSchema);

export default musicModel;

