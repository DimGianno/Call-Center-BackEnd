import type { CorsOptions } from "cors";

const PRODUCTION_NODE_ENVS = new Set(["production", "staging"]);

export const isProductionLikeEnvironment = (): boolean => {
    return PRODUCTION_NODE_ENVS.has(process.env.NODE_ENV ?? "");
};

export const normalizeOrigin = (origin: string): string | undefined => {
    const trimmedOrigin = origin.trim();

    if (trimmedOrigin.length === 0) {
        return undefined;
    }

    try {
        return new URL(trimmedOrigin).origin;
    } catch {
        return undefined;
    }
};

export const getAllowedFrontendOrigins = (): string[] => {
    const configuredOrigins = (process.env.FRONTEND_ORIGINS ?? "")
        .split(",")
        .map((origin) => normalizeOrigin(origin))
        .filter((origin): origin is string => origin !== undefined);

    return [...new Set(configuredOrigins)];
};

export const isOriginAllowed = (origin: string): boolean => {
    const normalizedOrigin = normalizeOrigin(origin);

    if (!normalizedOrigin) {
        return false;
    }

    const configuredOrigins = getAllowedFrontendOrigins();

    if (configuredOrigins.includes(normalizedOrigin)) {
        return true;
    }

    return !isProductionLikeEnvironment() && configuredOrigins.length === 0;
};

export const corsOptions: CorsOptions = {
    credentials: true,
    origin: (origin, callback) => {
        if (!origin || isOriginAllowed(origin)) {
            callback(null, true);
            return;
        }

        callback(null, false);
    }
};
