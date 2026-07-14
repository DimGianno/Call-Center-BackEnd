import { createHash, randomBytes } from "crypto";
import { Types } from "mongoose";

import { PasswordResetTokenDbModel } from "../db/models/passwordResetTokenDbModel.js";
import { UserDbModel, type UserDocument } from "../db/models/userDbModel.js";
import type { ServiceResult } from "../models/serviceTypes.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { sendEmail } from "./emailService.js";
import { deleteSessionsForUser } from "./sessionService.js";

const DEFAULT_TOKEN_TTL_MINUTES = 60;
const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;
const MILLISECONDS_PER_MINUTE = 60 * 1000;
const MILLISECONDS_PER_SECOND = 1000;
const INVALID_RESET_TOKEN_ERROR = "Password reset link is invalid or expired";

type PasswordUpdateResult = ServiceResult<{ message: string }>;

const getPositiveNumberEnv = (key: string, defaultValue: number): number => {
    const value = Number(process.env[key]);

    return Number.isFinite(value) && value > 0 ? value : defaultValue;
};

const getTokenTtlMilliseconds = (): number => {
    return (
        getPositiveNumberEnv(
            "PASSWORD_RESET_TOKEN_TTL_MINUTES",
            DEFAULT_TOKEN_TTL_MINUTES
        ) * MILLISECONDS_PER_MINUTE
    );
};

const getResendCooldownMilliseconds = (): number => {
    return (
        getPositiveNumberEnv(
            "PASSWORD_RESET_RESEND_COOLDOWN_SECONDS",
            DEFAULT_RESEND_COOLDOWN_SECONDS
        ) * MILLISECONDS_PER_SECOND
    );
};

const getFrontendPublicUrl = (): string => {
    return (
        process.env.FRONTEND_PUBLIC_URL?.replace(/\/$/, "") ??
        process.env.FRONTEND_ORIGINS?.split(",")[0]
            ?.trim()
            .replace(/\/$/, "") ??
        "http://localhost:5173"
    );
};

export const hashPasswordResetToken = (token: string): string => {
    return createHash("sha256").update(token).digest("hex");
};

const buildPasswordResetUrl = (token: string): string => {
    const url = new URL("/reset-password", getFrontendPublicUrl());
    url.searchParams.set("token", token);
    return url.toString();
};

const hasRecentPasswordResetEmail = async (userId: string) => {
    const cooldownStartedAt = new Date(
        Date.now() - getResendCooldownMilliseconds()
    );

    return (
        (await PasswordResetTokenDbModel.exists({
            user_id: userId,
            sent_at: { $gt: cooldownStartedAt }
        })) !== null
    );
};

export const requestPasswordReset = async (email: string): Promise<boolean> => {
    const user = await UserDbModel.findOne({
        email: email.trim().toLowerCase()
    });

    if (!user) {
        return false;
    }

    if (await hasRecentPasswordResetEmail(user._id.toString())) {
        return true;
    }

    const token = randomBytes(32).toString("base64url");
    const tokenDocument = await PasswordResetTokenDbModel.create({
        user_id: new Types.ObjectId(user._id.toString()),
        token_hash: hashPasswordResetToken(token),
        expires_at: new Date(Date.now() + getTokenTtlMilliseconds())
    });
    const resetUrl = buildPasswordResetUrl(token);
    const sent = await sendEmail({
        to: user.email,
        subject: "Reset your Call Center password",
        text: `Reset your password: ${resetUrl}`,
        html: `<p>Reset your Call Center password by opening this link:</p><p><a href="${resetUrl}">Reset password</a></p>`,
        idempotencyKey: `password-reset/${tokenDocument._id.toString()}`
    });

    if (!sent) {
        await PasswordResetTokenDbModel.deleteOne({ _id: tokenDocument._id });
        return true;
    }

    const sentAt = new Date();
    await Promise.all([
        PasswordResetTokenDbModel.updateOne(
            { _id: tokenDocument._id },
            { sent_at: sentAt }
        ),
        PasswordResetTokenDbModel.updateMany(
            {
                _id: { $ne: tokenDocument._id },
                user_id: user._id,
                used_at: null
            },
            { used_at: sentAt }
        )
    ]);

    return true;
};

const getUnchangedPasswordError = async (
    user: UserDocument,
    newPassword: string
): Promise<PasswordUpdateResult | null> => {
    const matchesCurrentPassword = await verifyPassword(
        newPassword,
        user.password_hash,
        user.password_salt
    );

    if (!matchesCurrentPassword) {
        return null;
    }

    return {
        success: false,
        statusCode: 400,
        error: "New password must be different from the current password"
    };
};

const applyPasswordReplacement = async (
    userId: string,
    newPassword: string
): Promise<void> => {
    const passwordFields = await hashPassword(newPassword);

    await UserDbModel.updateOne(
        { _id: userId },
        {
            ...passwordFields,
            $inc: { auth_token_version: 1 }
        }
    );
    await deleteSessionsForUser(userId);
};

export const resetPassword = async (
    token: string,
    newPassword: string
): Promise<PasswordUpdateResult> => {
    const tokenHash = hashPasswordResetToken(token);
    const resetToken = await PasswordResetTokenDbModel.findOne({
        token_hash: tokenHash,
        used_at: null,
        expires_at: { $gt: new Date() }
    });

    if (!resetToken) {
        return {
            success: false,
            statusCode: 400,
            error: INVALID_RESET_TOKEN_ERROR
        };
    }

    const user = await UserDbModel.findById(resetToken.user_id);

    if (!user) {
        return {
            success: false,
            statusCode: 400,
            error: INVALID_RESET_TOKEN_ERROR
        };
    }

    const unchangedPasswordError = await getUnchangedPasswordError(
        user,
        newPassword
    );

    if (unchangedPasswordError) {
        return unchangedPasswordError;
    }

    const usedAt = new Date();
    const consumedToken = await PasswordResetTokenDbModel.findOneAndUpdate(
        {
            _id: resetToken._id,
            used_at: null,
            expires_at: { $gt: usedAt }
        },
        { used_at: usedAt },
        { returnDocument: "after" }
    );

    if (!consumedToken) {
        return {
            success: false,
            statusCode: 400,
            error: INVALID_RESET_TOKEN_ERROR
        };
    }

    await applyPasswordReplacement(user._id.toString(), newPassword);
    await PasswordResetTokenDbModel.updateMany(
        { user_id: user._id, used_at: null },
        { used_at: usedAt }
    );

    return {
        success: true,
        data: { message: "Password reset successfully" }
    };
};

export const changePassword = async (
    userId: string,
    currentPassword: string,
    newPassword: string
): Promise<PasswordUpdateResult> => {
    const user = await UserDbModel.findById(userId);

    if (!user) {
        return {
            success: false,
            statusCode: 401,
            error: "Invalid session"
        };
    }

    const currentPasswordIsValid = await verifyPassword(
        currentPassword,
        user.password_hash,
        user.password_salt
    );

    if (!currentPasswordIsValid) {
        return {
            success: false,
            statusCode: 400,
            error: "Current password is incorrect"
        };
    }

    if (currentPassword === newPassword) {
        return {
            success: false,
            statusCode: 400,
            error: "New password must be different from the current password"
        };
    }

    await applyPasswordReplacement(user._id.toString(), newPassword);
    await PasswordResetTokenDbModel.updateMany(
        { user_id: user._id, used_at: null },
        { used_at: new Date() }
    );

    return {
        success: true,
        data: { message: "Password changed successfully" }
    };
};
