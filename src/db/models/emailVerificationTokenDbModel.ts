import mongoose, { Schema } from "mongoose";

export type EmailVerificationTokenDocument = {
    _id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    token_hash: string;
    expires_at: Date;
    used_at?: Date | null;
    created_at: Date;
};

const emailVerificationTokenSchema = new Schema<EmailVerificationTokenDocument>(
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
            required: true,
            index: true
        },
        used_at: {
            type: Date,
            default: null
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

emailVerificationTokenSchema.index(
    { expires_at: 1 },
    {
        expireAfterSeconds: 0,
        name: "email_verification_token_expiry_ttl_idx"
    }
);

export const EmailVerificationTokenDbModel =
    mongoose.model<EmailVerificationTokenDocument>(
        "EmailVerificationToken",
        emailVerificationTokenSchema
    );
