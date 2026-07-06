import type { Request, Response } from "express";
import { z } from "zod";

import { loginUser, signupUser } from "../services/authService.js";
import { deleteSession, refreshSession } from "../services/sessionService.js";
import type { AuthResult, AuthResponse } from "../models/userModel.js";
import {
    clearSessionCookie,
    getSessionCookieValue,
    setSessionCookie
} from "../utils/sessionCookie.js";
import { hasSetCookieHeader, logAuthDebug } from "../utils/authDebugLogger.js";

const signupRequestSchema = z
    .object({
        name: z.string().trim().min(1, "Name is required"),
        email: z.string().trim().email("Email must be a valid email address"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long")
    })
    .strict();

const loginRequestSchema = z
    .object({
        email: z.string().trim().email("Email must be a valid email address"),
        password: z.string().min(1, "Password is required")
    })
    .strict();

const getValidationErrorMessage = (error: z.ZodError): string => {
    return error.issues[0]?.message ?? "Invalid request body";
};

const getAuthResponseBody = (data: AuthResult): AuthResponse => {
    return {
        user: data.user,
        accessToken: data.accessToken,
        sessionExpiresAt: data.sessionExpiresAt
    };
};

export const signupController = async (req: Request, res: Response) => {
    const parsedBody = signupRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
        logAuthDebug(req, res, "POST /auth/signup", {
            outcome: "invalid_request",
            sessionDocumentFound: false,
            setCookieSent: false
        });
        res.status(400).json({
            error: getValidationErrorMessage(parsedBody.error)
        });
        return;
    }

    const result = await signupUser(parsedBody.data);

    if (!result.success) {
        logAuthDebug(req, res, "POST /auth/signup", {
            outcome: result.error,
            sessionDocumentFound: false,
            setCookieSent: false
        });
        res.status(result.statusCode).json({
            error: result.error
        });
        return;
    }

    setSessionCookie(
        res,
        result.data.sessionToken,
        new Date(result.data.sessionExpiresAt)
    );

    logAuthDebug(req, res, "POST /auth/signup", {
        outcome: "signup_success",
        sessionDocumentFound: true,
        setCookieSent: hasSetCookieHeader(res)
    });

    res.status(201).json(getAuthResponseBody(result.data));
};

export const loginController = async (req: Request, res: Response) => {
    const parsedBody = loginRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
        logAuthDebug(req, res, "POST /auth/login", {
            outcome: "invalid_request",
            sessionDocumentFound: false,
            setCookieSent: false
        });
        res.status(400).json({
            error: getValidationErrorMessage(parsedBody.error)
        });
        return;
    }

    const result = await loginUser(parsedBody.data);

    if (!result.success) {
        logAuthDebug(req, res, "POST /auth/login", {
            outcome: result.error,
            sessionDocumentFound: false,
            setCookieSent: false
        });
        res.status(result.statusCode).json({
            error: result.error
        });
        return;
    }

    setSessionCookie(
        res,
        result.data.sessionToken,
        new Date(result.data.sessionExpiresAt)
    );

    logAuthDebug(req, res, "POST /auth/login", {
        outcome: "login_success",
        sessionDocumentFound: true,
        setCookieSent: hasSetCookieHeader(res)
    });

    res.status(200).json(getAuthResponseBody(result.data));
};

export const refreshController = async (req: Request, res: Response) => {
    const sessionToken = getSessionCookieValue(req);

    if (sessionToken === undefined) {
        logAuthDebug(req, res, "POST /auth/refresh", {
            outcome: "missing_session_cookie",
            sessionDocumentFound: false,
            setCookieSent: false
        });
        res.status(401).json({
            error: "Session cookie is required"
        });
        return;
    }

    const result = await refreshSession(sessionToken);

    if (!result.success) {
        clearSessionCookie(res);
        logAuthDebug(req, res, "POST /auth/refresh", {
            outcome: result.error,
            sessionDocumentFound: result.sessionDocumentFound,
            setCookieSent: hasSetCookieHeader(res)
        });
        res.status(result.statusCode).json({
            error: result.error
        });
        return;
    }

    setSessionCookie(
        res,
        result.data.sessionToken,
        new Date(result.data.sessionExpiresAt)
    );

    logAuthDebug(req, res, "POST /auth/refresh", {
        outcome: "refresh_success",
        sessionDocumentFound: result.sessionDocumentFound,
        setCookieSent: hasSetCookieHeader(res)
    });

    res.status(200).json({
        user: result.data.user,
        sessionExpiresAt: result.data.sessionExpiresAt
    });
};

export const logoutController = async (req: Request, res: Response) => {
    const sessionToken = getSessionCookieValue(req);

    if (sessionToken !== undefined) {
        await deleteSession(sessionToken);
    }

    clearSessionCookie(res);

    res.status(200).json({
        message: "Logged out successfully"
    });
};
