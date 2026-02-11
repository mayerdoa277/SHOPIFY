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
            type: mongoose.Schema.Types.ObjectId,
            ref: "Album",
        }
    },
    {
        timestamps: true,
    }
);

const musicModel = model("Music", musicSchema);

export default musicModel;

