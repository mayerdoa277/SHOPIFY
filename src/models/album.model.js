import { Schema, model } from "mongoose";

const albumSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        musics: [
            {
                type: Schema.Types.ObjectId,
                ref: "Music",
            }
        ],
        coverImage: {
            type: String,
            required: true,
        },
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

const albumModel = model("Album", albumSchema);

export default albumModel;