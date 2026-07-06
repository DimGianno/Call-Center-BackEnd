import type { Request, Response } from "express";

import { getSessionCookieValue } from "./sessionCookie.js";

type AuthDebugDetails = {
    outcome: string;
    sessionDocumentFound?: boolean;
    setCookieSent?: boolean;
};

const getHeaderValue = (
    headerValue: string | string[] | undefined
): string | null => {
    if (Array.isArray(headerValue)) {
        return headerValue.join(",");
    }

    return headerValue ?? null;
};

export const isAuthDebugLoggingEnabled = (): boolean => {
    return process.env.AUTH_DEBUG_LOGS === "true";
};

export const hasSetCookieHeader = (res: Response): boolean => {
    const setCookieHeader = res.getHeader("Set-Cookie");

    if (Array.isArray(setCookieHeader)) {
        return setCookieHeader.length > 0;
    }

    return setCookieHeader !== undefined;
};

export const logAuthDebug = (
    req: Request,
    res: Response,
    route: string,
    details: AuthDebugDetails
) => {
    if (!isAuthDebugLoggingEnabled()) {
        return;
    }

    const payload = {
        event: "auth_session_debug",
        route,
        method: req.method,
        path: req.originalUrl,
        origin: getHeaderValue(req.headers.origin),
        userAgent: getHeaderValue(req.headers["user-agent"]),
        hasCookieHeader: req.headers.cookie !== undefined,
        hasSessionCookie: getSessionCookieValue(req) !== undefined,
        sessionDocumentFound: details.sessionDocumentFound ?? null,
        setCookieSent: details.setCookieSent ?? hasSetCookieHeader(res),
        outcome: details.outcome
    };

    console.log("[auth-debug]", JSON.stringify(payload));
};
