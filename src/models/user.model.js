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
            enum: ["user", "artist", "admin"],
            default: "user",
        },
        // Profile fields for all users
        profile: {
            firstName: {
                type: String,
                trim: true,
            },
            lastName: {
                type: String,
                trim: true,
            },
            bio: {
                type: String,
                maxlength: 500,
                trim: true,
            },
            avatar: {
                type: String,
                default: null,
            },
            dateOfBirth: {
                type: Date,
            },
            location: {
                type: String,
                trim: true,
            },
            website: {
                type: String,
                trim: true,
            },
            socialLinks: {
                facebook: String,
                twitter: String,
                instagram: String,
                youtube: String,
                spotify: String,
            }
        },
        // Artist-specific fields
        artistProfile: {
            genre: [{
                type: String,
                trim: true,
            }],
            bandName: {
                type: String,
                trim: true,
            },
            yearsActive: {
                type: Number,
                min: 0,
            },
            label: {
                type: String,
                trim: true,
            },
            influences: [{
                type: String,
                trim: true,
            }],
            equipment: [{
                type: String,
                trim: true,
            }],
            achievements: [{
                title: String,
                year: Number,
                description: String
            }],
            isVerified: {
                type: Boolean,
                default: false,
            },
            followerCount: {
                type: Number,
                default: 0,
            },
            followingCount: {
                type: Number,
                default: 0,
            }
        },
        // User preferences
        preferences: {
            favoriteGenres: [{
                type: String,
                trim: true,
            }],
            notificationSettings: {
                email: {
                    type: Boolean,
                    default: true,
                },
                push: {
                    type: Boolean,
                    default: true,
                },
                newMusic: {
                    type: Boolean,
                    default: true,
                },
                artistUpdates: {
                    type: Boolean,
                    default: true,
                }
            },
            privacy: {
                profileVisibility: {
                    type: String,
                    enum: ["public", "friends", "private"],
                    default: "public"
                },
                showEmail: {
                    type: Boolean,
                    default: false,
                },
                showLocation: {
                    type: Boolean,
                    default: true,
                }
            }
        },
        // Social features
        following: [{
            type: Schema.Types.ObjectId,
            ref: "User"
        }],
        followers: [{
            type: Schema.Types.ObjectId,
            ref: "User"
        }],
        // Status fields
        isActive: {
            type: Boolean,
            default: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        lastLogin: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Add indexes for better performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ "artistProfile.genre": 1 });
userSchema.index({ isActive: 1 });

const userModel = model("User", userSchema);

export default userModel;