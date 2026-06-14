import { UserDbModel } from "../db/models/userDbModel.js";
import { mapUserDocumentToUser } from "../mappers/userMapper.js";
import type {
    AuthResponse,
    LoginInput,
    SignupInput
} from "../models/userModel.js";
import type { ServiceResult } from "../models/serviceTypes.js";
import { signAccessToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

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
): Promise<ServiceResult<AuthResponse>> => {
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
            ...passwordFields
        });

        return {
            success: true,
            data: {
                user: mapUserDocumentToUser(user),
                accessToken: signAccessToken(user._id.toString())
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
): Promise<ServiceResult<AuthResponse>> => {
    const email = normalizeEmail(input.email);
    const user = await UserDbModel.findOne({ email });

    if (!user) {
        return {
            success: false,
            statusCode: 401,
            error: "Invalid email or password"
        };
    }

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

    return {
        success: true,
        data: {
            user: mapUserDocumentToUser(user),
            accessToken: signAccessToken(user._id.toString())
        }
    };
};
