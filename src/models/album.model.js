import { Schema, model } from "mongoose";

const albumSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        coverImage: {
            type: String,
            required: true,
        },
        musics: [
            {
                type: Schema.Types.ObjectId,
                ref: "Music",
                required: true,
            }
        ],
        artist: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Add indexes for better performance
albumSchema.index({ artist: 1 });
albumSchema.index({ title: "text" });
albumSchema.index({ createdAt: -1 });

const albumModel = model("Album", albumSchema);

export default albumModel;