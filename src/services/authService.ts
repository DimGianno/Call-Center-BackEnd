import { UserDbModel } from "../db/models/userDbModel.js";
import { mapUserDocumentToUser } from "../mappers/userMapper.js";
import type {
    AuthResult,
    LoginInput,
    SignupInput
} from "../models/userModel.js";
import type { ServiceResult } from "../models/serviceTypes.js";
import { signAccessToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import {
    EMAIL_VERIFICATION_REQUIRED_ERROR,
    ensureEmailVerificationDeadline,
    getEmailVerificationRequiredAt,
    getEmailVerificationStatus,
    isEmailVerificationGracePeriodExpired,
    sendVerificationEmailForUser
} from "./emailVerificationService.js";
import { createSession } from "./sessionService.js";
import { sendNewSignupNotification } from "./signupNotificationService.js";

const normalizeEmail = (email: string): string => {
    return email.trim().toLowerCase();
};

const isDuplicateKeyError = (error: unknown): boolean => {
    if (typeof error !== "object" || error === null || !("code" in error)) {
        return false;
    }

    return (error as { code?: unknown }).code === 11000;
};

export const signupUser = async (
    input: SignupInput
): Promise<ServiceResult<AuthResult>> => {
    const email = normalizeEmail(input.email);
    const existingUser = await UserDbModel.findOne({ email });

    if (existingUser) {
        return {
            success: false,
            statusCode: 409,
            error: "A user with this email already exists"
        };
    }

    const passwordFields = await hashPassword(input.password);

    try {
        const user = await UserDbModel.create({
            name: input.name.trim(),
            email,
            email_verification_required_at: getEmailVerificationRequiredAt(),
            ...passwordFields
        });
        const session = await createSession(user._id.toString());
        await Promise.all([
            sendVerificationEmailForUser(user).catch((error) => {
                console.warn(
                    "Failed to create or send verification email.",
                    error
                );
                return false;
            }),
            sendNewSignupNotification(user).catch((error) => {
                console.warn("Failed to send new signup notification.", error);
                return false;
            })
        ]);

        return {
            success: true,
            data: {
                user: mapUserDocumentToUser(user),
                accessToken: signAccessToken(user._id.toString(), {
                    tokenVersion: user.auth_token_version ?? 0
                }),
                emailVerification: getEmailVerificationStatus(user),
                sessionToken: session.sessionToken,
                sessionExpiresAt: session.expiresAt.toISOString()
            }
        };
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return {
                success: false,
                statusCode: 409,
                error: "A user with this email already exists"
            };
        }

        throw error;
    }
};

export const loginUser = async (
    input: LoginInput
): Promise<ServiceResult<AuthResult>> => {
    const email = normalizeEmail(input.email);
    const user = await UserDbModel.findOne({ email });

    if (!user) {
        return {
            success: false,
            statusCode: 401,
            error: "Invalid email or password"
        };
    }

    await ensureEmailVerificationDeadline(user);

    const isPasswordValid = await verifyPassword(
        input.password,
        user.password_hash,
        user.password_salt
    );

    if (!isPasswordValid) {
        return {
            success: false,
            statusCode: 401,
            error: "Invalid email or password"
        };
    }

    if (isEmailVerificationGracePeriodExpired(user)) {
        return {
            success: false,
            statusCode: 403,
            error: EMAIL_VERIFICATION_REQUIRED_ERROR
        };
    }

    const session = await createSession(user._id.toString());

    return {
        success: true,
        data: {
            user: mapUserDocumentToUser(user),
            accessToken: signAccessToken(user._id.toString(), {
                tokenVersion: user.auth_token_version ?? 0
            }),
            emailVerification: getEmailVerificationStatus(user),
            sessionToken: session.sessionToken,
            sessionExpiresAt: session.expiresAt.toISOString()
        }
    };
};
