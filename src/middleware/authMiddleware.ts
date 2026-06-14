import type { Request, RequestHandler } from "express";

import { verifyAccessToken } from "../utils/jwt.js";
import { isValidMongoObjectId } from "../utils/validators.js";

type RequestWithUserId = Request & {
    userId?: string;
};

export const requireAuth: RequestHandler = (req, res, next) => {
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
