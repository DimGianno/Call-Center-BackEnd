import mongoose, { Schema } from "mongoose";

export type SessionDocument = {
    _id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    token_hash: string;
    expires_at: Date;
    created_at: Date;
};

const sessionSchema = new Schema<SessionDocument>(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        token_hash: {
            type: String,
            required: true,
            unique: true
        },
        expires_at: {
            type: Date,
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

sessionSchema.index(
    {
        expires_at: 1
    },
    {
        expireAfterSeconds: 0,
        name: "session_expiry_ttl_idx"
    }
);

export const SessionDbModel = mongoose.model<SessionDocument>(
    "Session",
    sessionSchema
);
