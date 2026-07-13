import type { Request, Response } from "express";
import { z } from "zod";

import { loginUser, signupUser } from "../services/authService.js";
import {
    changePassword,
    requestPasswordReset,
    resetPassword
} from "../services/passwordResetService.js";
import {
    deleteSession,
    refreshSession,
    validateSessionToken
} from "../services/sessionService.js";
import type { AuthResult, AuthResponse } from "../models/userModel.js";
import {
    clearSessionCookie,
    getSessionCookieValue,
    setSessionCookie
} from "../utils/sessionCookie.js";
import { hasSetCookieHeader, logAuthDebug } from "../utils/authDebugLogger.js";
import {
    EMAIL_VERIFICATION_REQUIRED_CODE,
    EMAIL_VERIFICATION_REQUIRED_ERROR,
    resendVerificationEmail,
    verifyEmail
} from "../services/emailVerificationService.js";
import { getAuthenticatedUserId } from "../middleware/authMiddleware.js";

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

const verifyEmailRequestSchema = z
    .object({
        token: z.string().min(1, "Verification token is required")
    })
    .strict();

const forgotPasswordRequestSchema = z
    .object({
        email: z.string().trim().email("Email must be a valid email address")
    })
    .strict();

const resetPasswordRequestSchema = z
    .object({
        token: z.string().min(1, "Password reset token is required"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long")
    })
    .strict();

const changePasswordRequestSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters long")
    })
    .strict();

const getValidationErrorMessage = (error: z.ZodError): string => {
    return error.issues[0]?.message ?? "Invalid request body";
};

const getAuthResponseBody = (data: AuthResult): AuthResponse => {
    return {
        user: data.user,
        accessToken: data.accessToken,
        emailVerification: data.emailVerification,
        sessionExpiresAt: data.sessionExpiresAt
    };
};

const getAuthErrorBody = (error: string) => {
    if (error === EMAIL_VERIFICATION_REQUIRED_ERROR) {
        return {
            error,
            code: EMAIL_VERIFICATION_REQUIRED_CODE
        };
    }

    return {
        error
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
        res.status(result.statusCode).json(getAuthErrorBody(result.error));
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
        res.status(result.statusCode).json(getAuthErrorBody(result.error));
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
        res.status(result.statusCode).json(getAuthErrorBody(result.error));
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
        emailVerification: result.data.emailVerification,
        sessionExpiresAt: result.data.sessionExpiresAt
    });
};

export const resendVerificationController = async (
    req: Request,
    res: Response
) => {
    const sessionToken = getSessionCookieValue(req);

    if (sessionToken !== undefined) {
        const sessionResult = await validateSessionToken(sessionToken);

        if (sessionResult.success) {
            await resendVerificationEmail(sessionResult.userId);
        }
    }

    res.status(200).json({
        message:
            "If this account needs verification, a new email will be sent shortly."
    });
};

export const verifyEmailController = async (req: Request, res: Response) => {
    const parsedBody = verifyEmailRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
        res.status(400).json({
            error: getValidationErrorMessage(parsedBody.error)
        });
        return;
    }

    const result = await verifyEmail(parsedBody.data.token);

    if (!result.success) {
        res.status(result.statusCode).json({
            error: result.error
        });
        return;
    }

    res.status(200).json({
        message: "Email verified successfully",
        emailVerification: result.status
    });
};

export const forgotPasswordController = async (req: Request, res: Response) => {
    const parsedBody = forgotPasswordRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
        res.status(400).json({
            error: getValidationErrorMessage(parsedBody.error)
        });
        return;
    }

    await requestPasswordReset(parsedBody.data.email);

    res.status(200).json({
        message:
            "If an account exists for this email, a password reset link will be sent shortly."
    });
};

export const resetPasswordController = async (req: Request, res: Response) => {
    const parsedBody = resetPasswordRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
        res.status(400).json({
            error: getValidationErrorMessage(parsedBody.error)
        });
        return;
    }

    const result = await resetPassword(
        parsedBody.data.token,
        parsedBody.data.password
    );

    if (!result.success) {
        res.status(result.statusCode).json({ error: result.error });
        return;
    }

    clearSessionCookie(res);
    res.status(200).json(result.data);
};

export const changePasswordController = async (req: Request, res: Response) => {
    const parsedBody = changePasswordRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
        res.status(400).json({
            error: getValidationErrorMessage(parsedBody.error)
        });
        return;
    }

    const result = await changePassword(
        getAuthenticatedUserId(req),
        parsedBody.data.currentPassword,
        parsedBody.data.newPassword
    );

    if (!result.success) {
        res.status(result.statusCode).json({ error: result.error });
        return;
    }

    clearSessionCookie(res);
    res.status(200).json(result.data);
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
