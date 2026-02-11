import { Schema, model } from "mongoose";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            select: false, // Exclude password from query results by default
        },
        role: {
            type: String,
            enum: ["user", "artist"],
            default: "user",
        },
    },
    {
        timestamps: true,
    }
);

const userModel = model("User", userSchema);

export default userModel;