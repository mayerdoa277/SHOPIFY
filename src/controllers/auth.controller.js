import userModel from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
    sanitizeUsername,
    sanitizeEmail,
    sanitizePassword,
    sanitizeRole
} from "../utils/sanitize.utils.js";

const register = async (req, res) => {
    try {
        // Destructure the request body to get user details
        const { username, email, password, role = "user" } = req.body;

        // Check all required fields are provided
        if (!username || !email || !password || !role) {
            return res
                .status(400)
                .json(
                    {
                        success: false,
                        message: "All fields are required",
                    }
                )
        };

        // Sanitize inputs
        const cleanUsername = sanitizeUsername(username);
        const cleanEmail = sanitizeEmail(email);
        const cleanPassword = sanitizePassword(password);
        const cleanRole = sanitizeRole(role);


        // Check if the user already exists
        const isUserExist = await userModel.findOne(
            {
                $or: [
                    {
                        email: cleanEmail
                    },
                    {
                        username: cleanUsername
                    }
                ]
            }
        );

        if (isUserExist) {
            return res
                .status(400)
                .json(
                    {
                        success: false,
                        message: "User already exists",
                    }
                )
        };

        // password hashing
        const hashedPassword = await bcrypt.hash(cleanPassword, 10);

        // Create a new user
        const user = await userModel.create(
            {
                username: cleanUsername,
                email: cleanEmail,
                password: hashedPassword,
                role: cleanRole
            }
        );


        // generate JWT token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days 
        });

        // send response
        res
            .status(201)
            .json(
                {
                    success: true,
                    message: "User registered successfully",
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                    }
                }
            );
    } catch (error) {
        console.error("Error during registration:", error);

        res
            .status(500)
            .json(
                {
                    success: false,
                    message: "Server error"
                }
            );
    }
}

export { register };