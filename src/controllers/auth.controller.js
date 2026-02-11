import userModel from "../models/user.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

        // Trim input values to remove extra spaces
        const fixedUsername = username.trim()
            .replace(/\s+/g, ''); // ex: "  John Doe  " => "JohnDoe"

        const fixedEmail = email.trim()
            .replace(/\s+/g, '').toLowerCase(); // ex: "test @gmail.com " => "test@gmail.com"

        const fixedRole = role.trim()
            .replace(/\s+/g, ''); // ex: " artist " => "artist"

        // Validate role
        if (!["user", "artist"].includes(role)) {
            return res
                .status(400)
                .json(
                    {
                        success: false,
                        message: "Invalid role. Role must be either 'user' or 'artist'",
                    }
                )
        };

        // Sanitize inputs to prevent XSS attacks
        const cleanUsername = fixedUsername.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const cleanEmail = fixedEmail.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const cleanPassword = password.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const cleanRole = fixedRole.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // Validate password strength
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

        if (!passwordRegex.test(cleanPassword)) {
            return res
                .status(400)
                .json(
                    {
                        success: false,
                        message: "Password must be at least 8 characters long and contain both letters and numbers",
                    }
                )
        };

        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res
                .status(400)
                .json(
                    {
                        success: false,
                        message: "Invalid email format",
                    }
                )
        };

        // Check if the user already exists
        const isUserExist = await userModel.findOne(
            {
                $or: [
                    {
                        email: cleanEmail
                    },
                    {
                        username: username
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
        const user = new userModel(
            {
                username,
                email: cleanEmail,
                password: hashedPassword,
                role: "user",
            }
        );

        // generate JWT token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
            },
            process.env.JWT_SECRET,
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days 
        });

        // save and send response
        await user.save();
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