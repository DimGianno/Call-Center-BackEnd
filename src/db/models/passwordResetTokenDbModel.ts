import mongoose, { Schema } from "mongoose";

export type PasswordResetTokenDocument = {
    _id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    token_hash: string;
    expires_at: Date;
    sent_at?: Date | null;
    used_at?: Date | null;
    created_at: Date;
};

const passwordResetTokenSchema = new Schema<PasswordResetTokenDocument>(
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
        sent_at: {
            type: Date,
            default: null
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

passwordResetTokenSchema.index(
    { expires_at: 1 },
    {
        expireAfterSeconds: 0,
        name: "password_reset_token_expiry_ttl_idx"
    }
);

export const PasswordResetTokenDbModel =
    mongoose.model<PasswordResetTokenDocument>(
        "PasswordResetToken",
        passwordResetTokenSchema
    );
