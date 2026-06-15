import mongoose, { Schema } from "mongoose";

export type UserDocument = {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password_hash: string;
    password_salt: string;
    created_at: Date;
};

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
