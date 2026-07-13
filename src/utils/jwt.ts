import { createHmac, timingSafeEqual } from "crypto";

const ACCESS_TOKEN_TTL_SECONDS = 24 * 60 * 60;
const JWT_HEADER = {
    alg: "HS256",
    typ: "JWT"
} as const;

export type AccessTokenPayload = {
    sub: string;
    iat: number;
    exp: number;
    ver?: number;
};

type JwtHeader = {
    alg?: unknown;
    typ?: unknown;
};

type JwtVerificationResult =
    | {
          success: true;
          payload: AccessTokenPayload;
      }
    | {
          success: false;
          error: string;
      };

type SignAccessTokenOptions = {
    expiresInSeconds?: number;
    issuedAt?: number;
    tokenVersion?: number;
};

const getJwtSecret = (): string => {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret || jwtSecret.trim() === "") {
        throw new Error("JWT_SECRET is missing from environment variables");
    }

    return jwtSecret;
};

const encodeJsonSegment = (value: unknown): string => {
    return Buffer.from(JSON.stringify(value)).toString("base64url");
};

const decodeJsonSegment = (segment: string): unknown => {
    const decoded = Buffer.from(segment, "base64url").toString("utf8");

    return JSON.parse(decoded) as unknown;
};

const signTokenSegments = (
    encodedHeader: string,
    encodedPayload: string
): string => {
    return createHmac("sha256", getJwtSecret())
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest("base64url");
};

const hasValidSignature = (
    encodedHeader: string,
    encodedPayload: string,
    signature: string
): boolean => {
    const expectedSignature = signTokenSegments(encodedHeader, encodedPayload);
    const expected = Buffer.from(expectedSignature, "base64url");
    const submitted = Buffer.from(signature, "base64url");

    if (expected.length !== submitted.length) {
        return false;
    }

    return timingSafeEqual(expected, submitted);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null;
};

const isAccessTokenPayload = (value: unknown): value is AccessTokenPayload => {
    if (!isRecord(value)) {
        return false;
    }

    return (
        typeof value.sub === "string" &&
        typeof value.iat === "number" &&
        Number.isInteger(value.iat) &&
        typeof value.exp === "number" &&
        Number.isInteger(value.exp) &&
        (value.ver === undefined ||
            (typeof value.ver === "number" &&
                Number.isInteger(value.ver) &&
                value.ver >= 0))
    );
};

const isValidJwtHeader = (value: unknown): value is JwtHeader => {
    if (!isRecord(value)) {
        return false;
    }

    return value.alg === JWT_HEADER.alg && value.typ === JWT_HEADER.typ;
};

export const signAccessToken = (
    userId: string,
    options: SignAccessTokenOptions = {}
): string => {
    const issuedAt = options.issuedAt ?? Math.floor(Date.now() / 1000);
    const expiresInSeconds =
        options.expiresInSeconds ?? ACCESS_TOKEN_TTL_SECONDS;
    const payload: AccessTokenPayload = {
        sub: userId,
        iat: issuedAt,
        exp: issuedAt + expiresInSeconds,
        ver: options.tokenVersion ?? 0
    };

    const encodedHeader = encodeJsonSegment(JWT_HEADER);
    const encodedPayload = encodeJsonSegment(payload);
    const signature = signTokenSegments(encodedHeader, encodedPayload);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const verifyAccessToken = (token: string): JwtVerificationResult => {
    const tokenParts = token.split(".");

    if (tokenParts.length !== 3) {
        return {
            success: false,
            error: "Invalid token"
        };
    }

    const [encodedHeader, encodedPayload, signature] = tokenParts;

    try {
        const header = decodeJsonSegment(encodedHeader);

        if (!isValidJwtHeader(header)) {
            return {
                success: false,
                error: "Invalid token"
            };
        }

        if (!hasValidSignature(encodedHeader, encodedPayload, signature)) {
            return {
                success: false,
                error: "Invalid token"
            };
        }

        const payload = decodeJsonSegment(encodedPayload);

        if (!isAccessTokenPayload(payload)) {
            return {
                success: false,
                error: "Invalid token"
            };
        }

        const now = Math.floor(Date.now() / 1000);

        if (payload.exp <= now) {
            return {
                success: false,
                error: "Token expired"
            };
        }

        return {
            success: true,
            payload
        };
    } catch {
        return {
            success: false,
            error: "Invalid token"
        };
    }
};
