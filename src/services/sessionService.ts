import { createHash, randomBytes } from "crypto";
import { Types } from "mongoose";

import { SessionDbModel } from "../db/models/sessionDbModel.js";
import { UserDbModel } from "../db/models/userDbModel.js";
import { mapUserDocumentToUser } from "../mappers/userMapper.js";
import type { SessionResponse } from "../models/userModel.js";
import {
    EMAIL_VERIFICATION_REQUIRED_ERROR,
    ensureEmailVerificationDeadline,
    getEmailVerificationStatus,
    isEmailVerificationGracePeriodExpired
} from "./emailVerificationService.js";

const DEFAULT_SESSION_TTL_MINUTES = 10;
const MILLISECONDS_PER_MINUTE = 60 * 1000;

type SessionTokenResult = {
    sessionToken: string;
    expiresAt: Date;
};

type SessionValidationResult =
    | {
          success: true;
          sessionId: string;
          userId: string;
          expiresAt: Date;
          sessionDocumentFound: true;
      }
    | {
          success: false;
          error: string;
          sessionDocumentFound: boolean;
      };

export type SessionRefreshResult = SessionResponse & {
    sessionToken: string;
};

type SessionRefreshServiceResult =
    | {
          success: true;
          data: SessionRefreshResult;
          sessionDocumentFound: true;
      }
    | {
          success: false;
          statusCode: number;
          error: string;
          sessionDocumentFound: boolean;
      };

export const getSessionTtlMilliseconds = (): number => {
    const configuredTtl = Number(process.env.SESSION_TTL_MINUTES);

    if (Number.isFinite(configuredTtl) && configuredTtl > 0) {
        return configuredTtl * MILLISECONDS_PER_MINUTE;
    }

    return DEFAULT_SESSION_TTL_MINUTES * MILLISECONDS_PER_MINUTE;
};

export const hashSessionToken = (sessionToken: string): string => {
    return createHash("sha256").update(sessionToken).digest("hex");
};

const getSessionExpiryDate = (): Date => {
    return new Date(Date.now() + getSessionTtlMilliseconds());
};

export const createSession = async (
    userId: string
): Promise<SessionTokenResult> => {
    const sessionToken = randomBytes(32).toString("base64url");
    const expiresAt = getSessionExpiryDate();

    await SessionDbModel.create({
        user_id: new Types.ObjectId(userId),
        token_hash: hashSessionToken(sessionToken),
        expires_at: expiresAt
    });

    return {
        sessionToken,
        expiresAt
    };
};

export const validateSessionToken = async (
    sessionToken: string
): Promise<SessionValidationResult> => {
    const session = await SessionDbModel.findOne({
        token_hash: hashSessionToken(sessionToken)
    });

    if (!session) {
        return {
            success: false,
            error: "Invalid session",
            sessionDocumentFound: false
        };
    }

    if (session.expires_at.getTime() <= Date.now()) {
        await SessionDbModel.deleteOne({
            _id: session._id
        });

        return {
            success: false,
            error: "Session expired",
            sessionDocumentFound: true
        };
    }

    const userExists = await UserDbModel.exists({
        _id: session.user_id
    });

    if (!userExists) {
        await SessionDbModel.deleteOne({
            _id: session._id
        });

        return {
            success: false,
            error: "Invalid session",
            sessionDocumentFound: true
        };
    }

    return {
        success: true,
        sessionId: session._id.toString(),
        userId: session.user_id.toString(),
        expiresAt: session.expires_at,
        sessionDocumentFound: true
    };
};

export const refreshSession = async (
    sessionToken: string
): Promise<SessionRefreshServiceResult> => {
    const validationResult = await validateSessionToken(sessionToken);

    if (!validationResult.success) {
        return {
            success: false,
            statusCode: 401,
            error: validationResult.error,
            sessionDocumentFound: validationResult.sessionDocumentFound
        };
    }

    const expiresAt = getSessionExpiryDate();
    const refreshedSession = await SessionDbModel.findOneAndUpdate(
        {
            _id: validationResult.sessionId,
            expires_at: {
                $gt: new Date()
            }
        },
        {
            expires_at: expiresAt
        },
        {
            returnDocument: "after"
        }
    );

    if (!refreshedSession) {
        return {
            success: false,
            statusCode: 401,
            error: "Session expired",
            sessionDocumentFound: validationResult.sessionDocumentFound
        };
    }

    const user = await UserDbModel.findById(validationResult.userId);

    if (!user) {
        await SessionDbModel.deleteOne({
            _id: refreshedSession._id
        });

        return {
            success: false,
            statusCode: 401,
            error: "Invalid session",
            sessionDocumentFound: true
        };
    }

    await ensureEmailVerificationDeadline(user);

    if (isEmailVerificationGracePeriodExpired(user)) {
        return {
            success: false,
            statusCode: 403,
            error: EMAIL_VERIFICATION_REQUIRED_ERROR,
            sessionDocumentFound: true
        };
    }

    return {
        success: true,
        sessionDocumentFound: true,
        data: {
            user: mapUserDocumentToUser(user),
            emailVerification: getEmailVerificationStatus(user),
            sessionToken,
            sessionExpiresAt: refreshedSession.expires_at.toISOString()
        }
    };
};

export const deleteSession = async (sessionToken: string): Promise<void> => {
    await SessionDbModel.deleteOne({
        token_hash: hashSessionToken(sessionToken)
    });
};

export const deleteSessionsForUser = async (userId: string): Promise<void> => {
    await SessionDbModel.deleteMany({
        user_id: userId
    });
};
