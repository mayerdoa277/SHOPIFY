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

        // Validate password length before hashing
        if (cleanPassword.length < 6 || cleanPassword.length > 13) {
            return res
                .status(400)
                .json(
                    {
                        success: false,
                        message: "Password must be between 6 and 13 characters",
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

const logIn = async (req, res) => {
    // Destructure the request body to get email and password
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        return res
            .status(400)
            .json(
                {
                    success: false,
                    message: "Email and password are required",
                }
            );
    }

    // Sanitize inputs
    const cleanEmail = sanitizeEmail(email);
    const cleanPassword = sanitizePassword(password);

    // Check if the user exists
    const user = await userModel.findOne({
        email: cleanEmail
    }).select('+password');

    if (!user) {
        return res
            .status(401)
            .json(
                {
                    success: false,
                    message: "Invalid email or password",
                }
            );
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(cleanPassword, user.password);

    if (!isPasswordValid) {
        return res
            .status(401)
            .json(
                {
                    success: false,
                    message: "Invalid email or password",
                }
            );
    }

    // generate JWT token
    const token = jwt.sign({
        id: user._id,
        role: user.role
    }, process.env.JWT_SECRET, { expiresIn: "7d" }
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days 
    });

    // send response
    res
        .status(200)
        .json(
            {
                success: true,
                message: "User logged in successfully",
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
                token
            }
        );
};

const logOut = async (req, res) => {
    try {
        // Get user from token (if token exists)
        const token = req.cookies.token;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await userModel.findById(decoded.id);
                
                if (!user) {
                    // User doesn't exist, clear cookie and return appropriate message
                    res.clearCookie("token", {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "strict",
                    });
                    
                    return res.status(200).json({
                        success: true,
                        message: "Session cleared (user account no longer exists)",
                    });
                }
            } catch (jwtError) {
                // Invalid token, just clear cookie
                console.log("Invalid token during logout:", jwtError);
            }
        }

        // Clear cookie regardless
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.status(200).json({
            success: true,
            message: "User logged out successfully",
        });
    } catch (error) {
        console.error("Error during logout:", error);
        
        // Still clear cookie even if there's an error
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
        
        res.status(200).json({
            success: true,
            message: "Session cleared",
        });
    }
}

const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find().select("-password");
        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// get all user.role === "user"
const getAllRegularUsers = async (req, res) => {
    try {
        const users = await userModel.find({ role: "user" }).select("-password");
        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// get all user.role === "artist"
const getAllArtists = async (req, res) => {
    try {
        const users = await userModel.find({ role: "artist" }).select("-password");
        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// delete user Account "user"/"artist"
const deleteUserAccount = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if user exists first
        const existingUser = await userModel.findById(id);
        if (!existingUser) {
            return res.status(404)
                .json({
                    success: false,
                    message: "User not found"
                });
        }
        
        const user = await userModel.findByIdAndDelete(id);

        res.status(200)
            .json({
                success: true,
                message: "User deleted successfully",
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500)
            .json({
                success: false,
                message: "Failed to delete user"
            });
    }
}

export { register, logIn, logOut, getAllUsers, getAllRegularUsers, getAllArtists, deleteUserAccount };