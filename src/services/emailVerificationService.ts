import { createHash, randomBytes } from "crypto";
import { Types } from "mongoose";

import { EmailVerificationTokenDbModel } from "../db/models/emailVerificationTokenDbModel.js";
import { UserDbModel, type UserDocument } from "../db/models/userDbModel.js";
import { sendEmail } from "./emailService.js";

const DEFAULT_GRACE_DAYS = 7;
const DEFAULT_TOKEN_TTL_MINUTES = 24 * 60;
const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const MILLISECONDS_PER_MINUTE = 60 * 1000;
const MILLISECONDS_PER_SECOND = 1000;

export const EMAIL_VERIFICATION_REQUIRED_CODE = "EMAIL_VERIFICATION_REQUIRED";
export const EMAIL_VERIFICATION_REQUIRED_ERROR = "Email verification required";

export type EmailVerificationStatus = {
    verified: boolean;
    verifiedAt: string | null;
    requiredAt: string | null;
    gracePeriodExpired: boolean;
};

type VerificationResult =
    | {
          success: true;
          status: EmailVerificationStatus;
      }
    | {
          success: false;
          statusCode: number;
          error: string;
      };

const getPositiveNumberEnv = (key: string, defaultValue: number): number => {
    const value = Number(process.env[key]);

    if (Number.isFinite(value) && value > 0) {
        return value;
    }

    return defaultValue;
};

export const getEmailVerificationGraceMilliseconds = (): number => {
    return (
        getPositiveNumberEnv(
            "EMAIL_VERIFICATION_GRACE_DAYS",
            DEFAULT_GRACE_DAYS
        ) * MILLISECONDS_PER_DAY
    );
};

const getTokenTtlMilliseconds = (): number => {
    return (
        getPositiveNumberEnv(
            "EMAIL_VERIFICATION_TOKEN_TTL_MINUTES",
            DEFAULT_TOKEN_TTL_MINUTES
        ) * MILLISECONDS_PER_MINUTE
    );
};

const getResendCooldownMilliseconds = (): number => {
    return (
        getPositiveNumberEnv(
            "EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS",
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

export const hashEmailVerificationToken = (token: string): string => {
    return createHash("sha256").update(token).digest("hex");
};

export const getEmailVerificationRequiredAt = (): Date => {
    return new Date(Date.now() + getEmailVerificationGraceMilliseconds());
};

export const getEmailVerificationStatus = (
    user: UserDocument
): EmailVerificationStatus => {
    const verifiedAt = user.email_verified_at ?? null;
    const requiredAt = user.email_verification_required_at ?? null;

    return {
        verified: verifiedAt !== null,
        verifiedAt: verifiedAt?.toISOString() ?? null,
        requiredAt: requiredAt?.toISOString() ?? null,
        gracePeriodExpired:
            verifiedAt === null &&
            requiredAt !== null &&
            requiredAt.getTime() <= Date.now()
    };
};

export const isEmailVerificationGracePeriodExpired = (
    user: UserDocument
): boolean => {
    return getEmailVerificationStatus(user).gracePeriodExpired;
};

export const ensureEmailVerificationDeadline = async (
    user: UserDocument
): Promise<UserDocument> => {
    if (user.email_verified_at || user.email_verification_required_at) {
        return user;
    }

    user.email_verification_required_at = getEmailVerificationRequiredAt();
    await user.save();

    return user;
};

const createEmailVerificationToken = async (
    userId: string
): Promise<string> => {
    const token = randomBytes(32).toString("base64url");

    await EmailVerificationTokenDbModel.create({
        user_id: new Types.ObjectId(userId),
        token_hash: hashEmailVerificationToken(token),
        expires_at: new Date(Date.now() + getTokenTtlMilliseconds())
    });

    return token;
};

const buildVerificationUrl = (token: string): string => {
    const url = new URL("/verify-email", getFrontendPublicUrl());
    url.searchParams.set("token", token);

    return url.toString();
};

export const sendVerificationEmailForUser = async (
    user: UserDocument
): Promise<boolean> => {
    const token = await createEmailVerificationToken(user._id.toString());
    const verificationUrl = buildVerificationUrl(token);
    const sent = await sendEmail({
        to: user.email,
        subject: "Verify your Call Center email",
        text: `Verify your email address: ${verificationUrl}`,
        html: `<p>Verify your email address by opening this link:</p><p><a href="${verificationUrl}">Verify email</a></p>`
    });

    if (sent) {
        user.email_verification_sent_at = new Date();
        await user.save();
    }

    return sent;
};

export const resendVerificationEmail = async (
    userId: string
): Promise<{ sent: boolean }> => {
    const user = await UserDbModel.findById(userId);

    if (!user || user.email_verified_at) {
        return {
            sent: false
        };
    }

    await ensureEmailVerificationDeadline(user);

    const sentAt = user.email_verification_sent_at;
    const cooldownEndsAt =
        (sentAt?.getTime() ?? 0) + getResendCooldownMilliseconds();

    if (sentAt && cooldownEndsAt > Date.now()) {
        return {
            sent: false
        };
    }

    return {
        sent: await sendVerificationEmailForUser(user)
    };
};

export const verifyEmail = async (
    token: string
): Promise<VerificationResult> => {
    const tokenHash = hashEmailVerificationToken(token);
    const verificationToken =
        await EmailVerificationTokenDbModel.findOneAndUpdate(
            {
                token_hash: tokenHash,
                used_at: null,
                expires_at: {
                    $gt: new Date()
                }
            },
            {
                used_at: new Date()
            },
            {
                returnDocument: "after"
            }
        );

    if (!verificationToken) {
        return {
            success: false,
            statusCode: 400,
            error: "Verification link is invalid or expired"
        };
    }

    const user = await UserDbModel.findByIdAndUpdate(
        verificationToken.user_id,
        {
            email_verified_at: new Date(),
            email_verification_required_at: null
        },
        {
            returnDocument: "after"
        }
    );

    if (!user) {
        return {
            success: false,
            statusCode: 400,
            error: "Verification link is invalid or expired"
        };
    }

    return {
        success: true,
        status: getEmailVerificationStatus(user)
    };
};
