import mongoose, { Schema, model } from "mongoose";

const musicSchema = new Schema(
    {
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
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

const musicModel = model("Music", musicSchema);

export default musicModel;

