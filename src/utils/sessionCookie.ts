import type { CookieOptions, Request, Response } from "express";

export const SESSION_COOKIE_NAME = "session";

const PRODUCTION_NODE_ENVS = new Set(["production", "staging"]);

const isProductionLikeEnvironment = (): boolean => {
    return PRODUCTION_NODE_ENVS.has(process.env.NODE_ENV ?? "");
};

const getBaseSessionCookieOptions = (): CookieOptions => {
    const isProductionLike = isProductionLikeEnvironment();

    return {
        httpOnly: true,
        path: "/",
        sameSite: isProductionLike ? "none" : "lax",
        secure: isProductionLike
    };
};

export const getSessionCookieValue = (req: Request): string | undefined => {
    const cookieHeader = req.headers.cookie;

    if (!cookieHeader) {
        return undefined;
    }

    const cookies = cookieHeader.split(";");

    for (const cookie of cookies) {
        const [rawName, ...rawValueParts] = cookie.trim().split("=");

        if (rawName !== SESSION_COOKIE_NAME || rawValueParts.length === 0) {
            continue;
        }

        const rawValue = rawValueParts.join("=");

        try {
            return decodeURIComponent(rawValue);
        } catch {
            return rawValue;
        }
    }

    return undefined;
};

export const setSessionCookie = (
    res: Response,
    sessionToken: string,
    expiresAt: Date
) => {
    res.cookie(SESSION_COOKIE_NAME, sessionToken, {
        ...getBaseSessionCookieOptions(),
        expires: expiresAt,
        maxAge: Math.max(0, expiresAt.getTime() - Date.now())
    });
};

export const clearSessionCookie = (res: Response) => {
    res.clearCookie(SESSION_COOKIE_NAME, getBaseSessionCookieOptions());
};
