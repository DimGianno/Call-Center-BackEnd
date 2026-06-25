import type { Request, RequestHandler } from "express";

import { UserDbModel } from "../db/models/userDbModel.js";
import { validateSessionToken } from "../services/sessionService.js";
import { verifyAccessToken } from "../utils/jwt.js";
import {
    clearSessionCookie,
    getSessionCookieValue
} from "../utils/sessionCookie.js";
import { isValidMongoObjectId } from "../utils/validators.js";

type RequestWithUserId = Request & {
    userId?: string;
};

export const requireAuth: RequestHandler = async (req, res, next) => {
    const sessionToken = getSessionCookieValue(req);

    if (sessionToken !== undefined) {
        const sessionResult = await validateSessionToken(sessionToken);

        if (!sessionResult.success) {
            clearSessionCookie(res);
            res.status(401).json({
                error: sessionResult.error
            });
            return;
        }

        (req as RequestWithUserId).userId = sessionResult.userId;

        next();
        return;
    }

    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader?.startsWith("Bearer ")) {
        res.status(401).json({
            error: "Authorization header with Bearer token is required"
        });
        return;
    }

    const token = authorizationHeader.slice("Bearer ".length).trim();

    if (!token) {
        res.status(401).json({
            error: "Authorization header with Bearer token is required"
        });
        return;
    }

    const verificationResult = verifyAccessToken(token);

    if (!verificationResult.success) {
        res.status(401).json({
            error: verificationResult.error
        });
        return;
    }

    if (!isValidMongoObjectId(verificationResult.payload.sub)) {
        res.status(401).json({
            error: "Invalid token"
        });
        return;
    }

    const userExists = await UserDbModel.exists({
        _id: verificationResult.payload.sub
    });

    if (!userExists) {
        res.status(401).json({
            error: "Invalid token"
        });
        return;
    }

    (req as RequestWithUserId).userId = verificationResult.payload.sub;

    next();
};

export const getAuthenticatedUserId = (req: Request): string => {
    const authenticatedRequest = req as RequestWithUserId;

    if (!authenticatedRequest.userId) {
        throw new Error("Authenticated user missing from request");
    }

    return authenticatedRequest.userId;
};
