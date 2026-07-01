import mongoose, { Schema } from "mongoose";

export type TutorialDocument = {
    version: number;
    hasSeenWelcome: boolean;
    completedAt: string | null;
    skippedAt: string | null;
    completedTopics: string[];
};

export type UserDocument = {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password_hash: string;
    password_salt: string;
    tutorial?: TutorialDocument;
    created_at: Date;
};

const getDefaultTutorialState = (): TutorialDocument => {
    return {
        version: 1,
        hasSeenWelcome: false,
        completedAt: null,
        skippedAt: null,
        completedTopics: []
    };
};

const tutorialSchema = new Schema<TutorialDocument>(
    {
        version: {
            type: Number,
            required: true,
            default: 1
        },
        hasSeenWelcome: {
            type: Boolean,
            required: true,
            default: false
        },
        completedAt: {
            type: String,
            default: null
        },
        skippedAt: {
            type: String,
            default: null
        },
        completedTopics: {
            type: [String],
            default: []
        }
    },
    {
        _id: false
    }
);

const userSchema = new Schema<UserDocument>(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password_hash: {
            type: String,
            required: true
        },
        password_salt: {
            type: String,
            required: true
        },
        tutorial: {
            type: tutorialSchema,
            required: true,
            default: getDefaultTutorialState
        },
        created_at: {
            type: Date,
            required: true,
            default: Date.now
        }
    },
    {
        versionKey: false
    }
);

export const UserDbModel = mongoose.model<UserDocument>("User", userSchema);
