import type { Request, RequestHandler } from "express";

import { UserDbModel } from "../db/models/userDbModel.js";
import { validateSessionToken } from "../services/sessionService.js";
import { verifyAccessToken } from "../utils/jwt.js";
import {
    clearSessionCookie,
    getSessionCookieValue
} from "../utils/sessionCookie.js";
import { logAuthDebug } from "../utils/authDebugLogger.js";
import { isValidMongoObjectId } from "../utils/validators.js";

type RequestWithUserId = Request & {
    userId?: string;
};

const isCallsCollectionRequest = (req: Request): boolean => {
    return (
        req.method === "GET" &&
        (req.originalUrl === "/calls" || req.originalUrl.startsWith("/calls?"))
    );
};

const logCallsAuthDebug = (
    req: Request,
    res: Parameters<typeof logAuthDebug>[1],
    details: Parameters<typeof logAuthDebug>[3]
) => {
    if (!isCallsCollectionRequest(req)) {
        return;
    }

    logAuthDebug(req, res, "GET /calls", details);
};

export const requireAuth: RequestHandler = async (req, res, next) => {
    const sessionToken = getSessionCookieValue(req);

    if (sessionToken !== undefined) {
        const sessionResult = await validateSessionToken(sessionToken);

        if (!sessionResult.success) {
            clearSessionCookie(res);
            logCallsAuthDebug(req, res, {
                outcome: sessionResult.error,
                sessionDocumentFound: sessionResult.sessionDocumentFound
            });
            res.status(401).json({
                error: sessionResult.error
            });
            return;
        }

        (req as RequestWithUserId).userId = sessionResult.userId;
        logCallsAuthDebug(req, res, {
            outcome: "session_authenticated",
            sessionDocumentFound: sessionResult.sessionDocumentFound
        });

        next();
        return;
    }

    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader?.startsWith("Bearer ")) {
        logCallsAuthDebug(req, res, {
            outcome: "missing_credentials",
            sessionDocumentFound: false
        });
        res.status(401).json({
            error: "Authorization header with Bearer token is required"
        });
        return;
    }

    const token = authorizationHeader.slice("Bearer ".length).trim();

    if (!token) {
        logCallsAuthDebug(req, res, {
            outcome: "missing_bearer_token",
            sessionDocumentFound: false
        });
        res.status(401).json({
            error: "Authorization header with Bearer token is required"
        });
        return;
    }

    const verificationResult = verifyAccessToken(token);

    if (!verificationResult.success) {
        logCallsAuthDebug(req, res, {
            outcome: verificationResult.error,
            sessionDocumentFound: false
        });
        res.status(401).json({
            error: verificationResult.error
        });
        return;
    }

    if (!isValidMongoObjectId(verificationResult.payload.sub)) {
        logCallsAuthDebug(req, res, {
            outcome: "invalid_bearer_token_subject",
            sessionDocumentFound: false
        });
        res.status(401).json({
            error: "Invalid token"
        });
        return;
    }

    const userExists = await UserDbModel.exists({
        _id: verificationResult.payload.sub
    });

    if (!userExists) {
        logCallsAuthDebug(req, res, {
            outcome: "invalid_bearer_token_user",
            sessionDocumentFound: false
        });
        res.status(401).json({
            error: "Invalid token"
        });
        return;
    }

    (req as RequestWithUserId).userId = verificationResult.payload.sub;
    logCallsAuthDebug(req, res, {
        outcome: "bearer_authenticated",
        sessionDocumentFound: false
    });

    next();
};

export const getAuthenticatedUserId = (req: Request): string => {
    const authenticatedRequest = req as RequestWithUserId;

    if (!authenticatedRequest.userId) {
        throw new Error("Authenticated user missing from request");
    }

    return authenticatedRequest.userId;
};
