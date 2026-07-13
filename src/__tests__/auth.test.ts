import request, { type Response } from "supertest";
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../app.js";
import { EmailVerificationTokenDbModel } from "../db/models/emailVerificationTokenDbModel.js";
import { SessionDbModel } from "../db/models/sessionDbModel.js";
import { UserDbModel } from "../db/models/userDbModel.js";
import { hashEmailVerificationToken } from "../services/emailVerificationService.js";
import { hashSessionToken } from "../services/sessionService.js";
import { signAccessToken } from "../utils/jwt.js";
import { SESSION_COOKIE_NAME } from "../utils/sessionCookie.js";

type AuthResponseBody = {
    user: {
        id: string;
        name: string;
        email: string;
        email_verified_at?: string | null;
        email_verification_required_at?: string | null;
        email_verification_sent_at?: string | null;
        created_at: string;
        password_hash?: string;
        password_salt?: string;
    };
    accessToken: string;
    emailVerification: {
        verified: boolean;
        verifiedAt: string | null;
        requiredAt: string | null;
        gracePeriodExpired: boolean;
    };
    sessionExpiresAt: string;
};

let mongoServer: MongoMemoryServer;

const originalNodeEnv = process.env.NODE_ENV;
const originalFrontendOrigins = process.env.FRONTEND_ORIGINS;
const originalAuthDebugLogs = process.env.AUTH_DEBUG_LOGS;
const originalResendApiKey = process.env.RESEND_API_KEY;
const originalEmailFrom = process.env.EMAIL_FROM;
const originalNewSignupNotificationEmail =
    process.env.NEW_SIGNUP_NOTIFICATION_EMAIL;
const originalFrontendPublicUrl = process.env.FRONTEND_PUBLIC_URL;
const originalVerificationGraceDays = process.env.EMAIL_VERIFICATION_GRACE_DAYS;
const originalVerificationTokenTtlMinutes =
    process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES;
const originalVerificationResendCooldownSeconds =
    process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS;

const restoreEnvValue = (name: string, value: string | undefined) => {
    if (value === undefined) {
        delete process.env[name];
        return;
    }

    process.env[name] = value;
};

const getSetCookies = (response: Response): string[] => {
    const setCookieHeader = response.headers["set-cookie"];

    if (Array.isArray(setCookieHeader)) {
        return setCookieHeader;
    }

    if (typeof setCookieHeader === "string") {
        return [setCookieHeader];
    }

    return [];
};

const getSessionSetCookie = (response: Response): string => {
    const sessionSetCookie = getSetCookies(response).find((cookie) =>
        cookie.startsWith(`${SESSION_COOKIE_NAME}=`)
    );

    if (!sessionSetCookie) {
        throw new Error("Expected session Set-Cookie header");
    }

    return sessionSetCookie;
};

const getSessionCookieHeader = (response: Response): string => {
    return getSessionSetCookie(response).split(";")[0];
};

const expectProductionSessionCookie = (cookie: string) => {
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=None");
    expect(cookie).toContain("Path=/");
    expect(cookie).not.toMatch(/;\s*Domain=/i);
};

const mockResendEmail = () => {
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.EMAIL_FROM = "Call Center <verify@example.com>";
    process.env.FRONTEND_PUBLIC_URL = "https://frontend.example.com";

    return jest.spyOn(global, "fetch").mockResolvedValue(
        new Response(
            JSON.stringify({
                id: "email-id"
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        )
    );
};

beforeAll(async () => {
    process.env.JWT_SECRET = "test-jwt-secret";
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
    jest.restoreAllMocks();
    await EmailVerificationTokenDbModel.deleteMany({});
    await SessionDbModel.deleteMany({});
    await UserDbModel.deleteMany({});
});

afterEach(() => {
    restoreEnvValue("NODE_ENV", originalNodeEnv);
    restoreEnvValue("FRONTEND_ORIGINS", originalFrontendOrigins);
    restoreEnvValue("AUTH_DEBUG_LOGS", originalAuthDebugLogs);
    restoreEnvValue("RESEND_API_KEY", originalResendApiKey);
    restoreEnvValue("EMAIL_FROM", originalEmailFrom);
    restoreEnvValue(
        "NEW_SIGNUP_NOTIFICATION_EMAIL",
        originalNewSignupNotificationEmail
    );
    restoreEnvValue("FRONTEND_PUBLIC_URL", originalFrontendPublicUrl);
    restoreEnvValue(
        "EMAIL_VERIFICATION_GRACE_DAYS",
        originalVerificationGraceDays
    );
    restoreEnvValue(
        "EMAIL_VERIFICATION_TOKEN_TTL_MINUTES",
        originalVerificationTokenTtlMinutes
    );
    restoreEnvValue(
        "EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS",
        originalVerificationResendCooldownSeconds
    );
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("cross-site session cookie and CORS behavior", () => {
    const allowedOrigin = "https://call-center-frontend-preview.vercel.app";
    const disallowedOrigin = "https://not-the-frontend.example";

    test("sets a secure SameSite=None host-only cookie in staging and production", async () => {
        process.env.NODE_ENV = "staging";

        const signupResponse = await request(app).post("/auth/signup").send({
            name: "Cross Site User",
            email: "cross-site@example.com",
            password: "password123"
        });

        expect(signupResponse.status).toBe(201);
        expectProductionSessionCookie(getSessionSetCookie(signupResponse));

        process.env.NODE_ENV = "production";

        const loginResponse = await request(app).post("/auth/login").send({
            email: "cross-site@example.com",
            password: "password123"
        });

        expect(loginResponse.status).toBe(200);
        expectProductionSessionCookie(getSessionSetCookie(loginResponse));
    });

    test("allows an exact configured frontend origin with credentials", async () => {
        process.env.NODE_ENV = "production";
        process.env.FRONTEND_ORIGINS = ` ${allowedOrigin}/,https://other-preview.vercel.app `;

        const response = await request(app)
            .options("/auth/login")
            .set("Origin", allowedOrigin)
            .set("Access-Control-Request-Method", "POST")
            .set("Access-Control-Request-Headers", "content-type");

        expect(response.status).toBe(204);
        expect(response.headers["access-control-allow-origin"]).toBe(
            allowedOrigin
        );
        expect(response.headers["access-control-allow-credentials"]).toBe(
            "true"
        );
    });

    test("does not approve a disallowed frontend origin for credentialed CORS", async () => {
        process.env.NODE_ENV = "production";
        process.env.FRONTEND_ORIGINS = allowedOrigin;

        const response = await request(app)
            .options("/auth/login")
            .set("Origin", disallowedOrigin)
            .set("Access-Control-Request-Method", "POST")
            .set("Access-Control-Request-Headers", "content-type");

        expect(response.headers["access-control-allow-origin"]).toBeUndefined();
        expect(
            response.headers["access-control-allow-credentials"]
        ).toBeUndefined();
    });

    test.each([
        ["/auth/signup", "POST"],
        ["/auth/login", "POST"],
        ["/auth/refresh", "POST"],
        ["/calls", "GET"]
    ])("allows credentialed preflight for %s", async (path, method) => {
        process.env.NODE_ENV = "production";
        process.env.FRONTEND_ORIGINS = allowedOrigin;

        const response = await request(app)
            .options(path)
            .set("Origin", allowedOrigin)
            .set("Access-Control-Request-Method", method)
            .set("Access-Control-Request-Headers", "content-type");

        expect(response.status).toBe(204);
        expect(response.headers["access-control-allow-origin"]).toBe(
            allowedOrigin
        );
        expect(response.headers["access-control-allow-credentials"]).toBe(
            "true"
        );
    });
});

describe("POST /auth/signup", () => {
    test("creates a user and returns a safe profile with an access token and session cookie", async () => {
        const response = await request(app).post("/auth/signup").send({
            name: "Dimitrios",
            email: "USER@example.com",
            password: "password123"
        });
        const responseBody = response.body as AuthResponseBody;
        const storedUser = await UserDbModel.findOne({
            email: "user@example.com"
        });
        const storedSession = await SessionDbModel.findOne({
            user_id: storedUser?._id
        });
        const sessionSetCookie = getSessionSetCookie(response);

        expect(response.status).toBe(201);
        expect(responseBody.user).toMatchObject({
            name: "Dimitrios",
            email: "user@example.com"
        });
        expect(typeof responseBody.user.id).toBe("string");
        expect(typeof responseBody.user.created_at).toBe("string");
        expect(typeof responseBody.accessToken).toBe("string");
        expect(typeof responseBody.sessionExpiresAt).toBe("string");
        expect(responseBody.user.password_hash).toBeUndefined();
        expect(responseBody.user.password_salt).toBeUndefined();

        expect(storedUser).not.toBeNull();
        expect(storedUser?.password_hash).not.toBe("password123");
        expect(storedUser?.password_salt).toBeTruthy();
        expect(storedUser?.email_verified_at).toBeNull();
        expect(storedUser?.email_verification_required_at).toBeInstanceOf(Date);
        expect(responseBody.emailVerification.verified).toBe(false);
        expect(responseBody.emailVerification.requiredAt).toBeTruthy();
        expect(responseBody.emailVerification.gracePeriodExpired).toBe(false);
        expect(storedSession).not.toBeNull();
        expect(storedSession?.token_hash).toHaveLength(64);
        expect(storedSession?.expires_at.toISOString()).toBe(
            responseBody.sessionExpiresAt
        );
        expect(sessionSetCookie).toContain("HttpOnly");
    });

    test("creates a hashed email verification token and attempts to send email", async () => {
        const fetchMock = mockResendEmail();

        const response = await request(app).post("/auth/signup").send({
            name: "Verify User",
            email: "verify@example.com",
            password: "password123"
        });
        const storedUser = await UserDbModel.findOne({
            email: "verify@example.com"
        });
        const verificationToken = await EmailVerificationTokenDbModel.findOne({
            user_id: storedUser?._id
        });

        expect(response.status).toBe(201);
        expect(verificationToken).not.toBeNull();
        expect(verificationToken?.token_hash).toHaveLength(64);
        expect(verificationToken?.used_at).toBeNull();
        expect(storedUser?.email_verification_sent_at).toBeInstanceOf(Date);
        expect(fetchMock).toHaveBeenCalledWith(
            "https://api.resend.com/emails",
            expect.objectContaining({
                method: "POST"
            })
        );
    });

    test("sends a private signup notification only in production", async () => {
        process.env.NODE_ENV = "production";
        process.env.NEW_SIGNUP_NOTIFICATION_EMAIL = "owner@example.com";
        const fetchMock = mockResendEmail();

        const response = await request(app).post("/auth/signup").send({
            name: "Notify <Admin>",
            email: "notify@example.com",
            password: "password123"
        });
        const storedUser = await UserDbModel.findOne({
            email: "notify@example.com"
        });
        const notificationCall = fetchMock.mock.calls.find(([, options]) => {
            const payload = JSON.parse(String(options?.body)) as {
                to: string[];
            };

            return payload.to.includes("owner@example.com");
        });

        expect(response.status).toBe(201);
        expect(storedUser).not.toBeNull();
        expect(notificationCall).toBeDefined();

        if (!notificationCall || !storedUser) {
            throw new Error("Expected a production signup notification");
        }

        const [, requestOptions] = notificationCall;
        const payload = JSON.parse(String(requestOptions?.body)) as {
            html: string;
            subject: string;
            text: string;
            to: string[];
        };

        expect(payload).toMatchObject({
            subject: "[Production] New Call Center signup",
            to: ["owner@example.com"]
        });
        expect(payload.text).toContain("Name: Notify <Admin>");
        expect(payload.html).toContain("Notify &lt;Admin&gt;");
        expect(payload.html).not.toContain("Notify <Admin>");
        expect(requestOptions?.headers).toMatchObject({
            "Idempotency-Key": `new-signup/${storedUser._id.toString()}`
        });
    });

    test("does not send the private signup notification outside production", async () => {
        process.env.NODE_ENV = "staging";
        process.env.NEW_SIGNUP_NOTIFICATION_EMAIL = "owner@example.com";
        const fetchMock = mockResendEmail();

        const response = await request(app).post("/auth/signup").send({
            name: "Staging User",
            email: "staging-user@example.com",
            password: "password123"
        });
        const recipients = fetchMock.mock.calls.map(([, options]) => {
            const payload = JSON.parse(String(options?.body)) as {
                to: string[];
            };

            return payload.to;
        });

        expect(response.status).toBe(201);
        expect(recipients).not.toContainEqual(["owner@example.com"]);
    });

    test("keeps signup successful when the private notification fails", async () => {
        process.env.NODE_ENV = "production";
        process.env.NEW_SIGNUP_NOTIFICATION_EMAIL = "owner@example.com";
        process.env.RESEND_API_KEY = "test-resend-key";
        process.env.EMAIL_FROM = "Call Center <verify@example.com>";
        process.env.FRONTEND_PUBLIC_URL = "https://frontend.example.com";
        jest.spyOn(console, "warn").mockImplementation(() => undefined);
        jest.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
            const payload = JSON.parse(String(init?.body)) as {
                to: string[];
            };
            const status = payload.to.includes("owner@example.com") ? 500 : 200;

            return new Response(null, { status });
        });

        const response = await request(app).post("/auth/signup").send({
            name: "Resilient User",
            email: "resilient@example.com",
            password: "password123"
        });

        expect(response.status).toBe(201);
        expect(
            await UserDbModel.exists({ email: "resilient@example.com" })
        ).not.toBeNull();
        expect(await SessionDbModel.countDocuments({})).toBe(1);
    });

    test("rejects duplicate emails after normalization", async () => {
        await request(app).post("/auth/signup").send({
            name: "Dimitrios",
            email: "USER@example.com",
            password: "password123"
        });

        const response = await request(app).post("/auth/signup").send({
            name: "Second User",
            email: "user@example.com",
            password: "password123"
        });
        const userCount = await UserDbModel.countDocuments({});

        expect(response.status).toBe(409);
        expect(userCount).toBe(1);
    });

    test("returns 400 for invalid signup input", async () => {
        const response = await request(app).post("/auth/signup").send({
            name: "",
            email: "not-an-email",
            password: "short"
        });

        expect(response.status).toBe(400);
    });
});

describe("email verification", () => {
    test("verifies a valid token once", async () => {
        const user = await UserDbModel.create({
            name: "Verify Token User",
            email: "verify-token@example.com",
            password_hash: "hash",
            password_salt: "salt",
            email_verification_required_at: new Date(Date.now() + 1000)
        });
        const token = "valid-verification-token";

        await EmailVerificationTokenDbModel.create({
            user_id: user._id,
            token_hash: hashEmailVerificationToken(token),
            expires_at: new Date(Date.now() + 60_000)
        });

        const response = await request(app)
            .post("/auth/verify-email")
            .send({ token });
        const secondResponse = await request(app)
            .post("/auth/verify-email")
            .send({ token });
        const storedUser = await UserDbModel.findById(user._id);

        expect(response.status).toBe(200);
        expect(response.body.emailVerification.verified).toBe(true);
        expect(storedUser?.email_verified_at).toBeInstanceOf(Date);
        expect(storedUser?.email_verification_required_at).toBeNull();
        expect(secondResponse.status).toBe(400);
    });

    test("rejects expired or invalid verification tokens", async () => {
        const user = await UserDbModel.create({
            name: "Expired Token User",
            email: "expired-token@example.com",
            password_hash: "hash",
            password_salt: "salt",
            email_verification_required_at: new Date(Date.now() + 1000)
        });

        await EmailVerificationTokenDbModel.create({
            user_id: user._id,
            token_hash: hashEmailVerificationToken("expired-token"),
            expires_at: new Date(Date.now() - 1000)
        });

        const expiredResponse = await request(app)
            .post("/auth/verify-email")
            .send({ token: "expired-token" });
        const invalidResponse = await request(app)
            .post("/auth/verify-email")
            .send({ token: "missing-token" });

        expect(expiredResponse.status).toBe(400);
        expect(invalidResponse.status).toBe(400);
    });

    test("resend endpoint is generic and enforces cooldown", async () => {
        mockResendEmail();

        const signupResponse = await request(app).post("/auth/signup").send({
            name: "Resend User",
            email: "resend@example.com",
            password: "password123"
        });
        const sessionCookie = getSessionCookieHeader(signupResponse);
        const tokenCountBefore =
            await EmailVerificationTokenDbModel.countDocuments({});

        const response = await request(app)
            .post("/auth/resend-verification")
            .set("Cookie", sessionCookie);
        const tokenCountAfter =
            await EmailVerificationTokenDbModel.countDocuments({});

        expect(response.status).toBe(200);
        expect(response.body.message).toContain(
            "If this account needs verification"
        );
        expect(tokenCountAfter).toBe(tokenCountBefore);
    });
});

describe("POST /auth/login", () => {
    test("logs in a user and returns a safe profile with an access token and session cookie", async () => {
        await request(app).post("/auth/signup").send({
            name: "Login User",
            email: "login@example.com",
            password: "password123"
        });

        const response = await request(app).post("/auth/login").send({
            email: "LOGIN@example.com",
            password: "password123"
        });
        const responseBody = response.body as AuthResponseBody;

        expect(response.status).toBe(200);
        expect(responseBody.user).toMatchObject({
            name: "Login User",
            email: "login@example.com"
        });
        expect(typeof responseBody.accessToken).toBe("string");
        expect(typeof responseBody.sessionExpiresAt).toBe("string");
        expect(responseBody.user.password_hash).toBeUndefined();
        expect(responseBody.user.password_salt).toBeUndefined();
        expect(getSessionSetCookie(response)).toContain("HttpOnly");
    });

    test("returns 401 for a wrong password", async () => {
        await request(app).post("/auth/signup").send({
            name: "Login User",
            email: "login@example.com",
            password: "password123"
        });

        const response = await request(app).post("/auth/login").send({
            email: "login@example.com",
            password: "wrong-password"
        });

        expect(response.status).toBe(401);
    });

    test("returns 401 for an unknown email", async () => {
        const response = await request(app).post("/auth/login").send({
            email: "unknown@example.com",
            password: "password123"
        });

        expect(response.status).toBe(401);
    });

    test("returns 403 when an unverified user's grace period has expired", async () => {
        await request(app).post("/auth/signup").send({
            name: "Expired Verification User",
            email: "expired-verification@example.com",
            password: "password123"
        });
        await UserDbModel.updateOne(
            {
                email: "expired-verification@example.com"
            },
            {
                email_verification_required_at: new Date(Date.now() - 1000)
            }
        );

        const response = await request(app).post("/auth/login").send({
            email: "expired-verification@example.com",
            password: "password123"
        });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe("EMAIL_VERIFICATION_REQUIRED");
    });
});

describe("session protected routes", () => {
    test("allows a protected route with a valid session cookie", async () => {
        const signupResponse = await request(app).post("/auth/signup").send({
            name: "Cookie User",
            email: "cookie@example.com",
            password: "password123"
        });
        const sessionCookie = getSessionCookieHeader(signupResponse);

        const response = await request(app)
            .get("/calls")
            .set("Cookie", sessionCookie);

        expect(response.status).toBe(200);
        expect(response.body.calls).toEqual([]);
    });

    test("returns 401 and clears the cookie when a session is expired", async () => {
        const user = await UserDbModel.create({
            name: "Expired Session User",
            email: "expired-session@example.com",
            password_hash: "hash",
            password_salt: "salt"
        });
        const expiredSessionToken = "expired-session-token";

        await SessionDbModel.create({
            user_id: user._id,
            token_hash: hashSessionToken(expiredSessionToken),
            expires_at: new Date(Date.now() - 1000)
        });

        const response = await request(app)
            .get("/calls")
            .set("Cookie", `${SESSION_COOKIE_NAME}=${expiredSessionToken}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Session expired");
        expect(getSessionSetCookie(response)).toContain(
            `${SESSION_COOKIE_NAME}=`
        );
        expect(await SessionDbModel.countDocuments({})).toBe(0);
    });

    test("returns 401 when a session cookie points to a deleted session", async () => {
        const signupResponse = await request(app).post("/auth/signup").send({
            name: "Deleted Session User",
            email: "deleted-session@example.com",
            password: "password123"
        });
        const sessionCookie = getSessionCookieHeader(signupResponse);

        await SessionDbModel.deleteMany({});

        const response = await request(app)
            .get("/calls")
            .set("Cookie", sessionCookie);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Invalid session");
    });

    test("does not fall back to bearer auth when an invalid session cookie is present", async () => {
        const user = await UserDbModel.create({
            name: "Bearer Fallback User",
            email: "bearer-fallback@example.com",
            password_hash: "hash",
            password_salt: "salt"
        });
        const token = signAccessToken(user._id.toString());

        const response = await request(app)
            .get("/calls")
            .set("Authorization", `Bearer ${token}`)
            .set("Cookie", `${SESSION_COOKIE_NAME}=invalid-session`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Invalid session");
    });

    test("returns 403 when a valid session belongs to an expired unverified user", async () => {
        const signupResponse = await request(app).post("/auth/signup").send({
            name: "Expired Session Verification User",
            email: "expired-session-verification@example.com",
            password: "password123"
        });
        const sessionCookie = getSessionCookieHeader(signupResponse);

        await UserDbModel.updateOne(
            {
                email: "expired-session-verification@example.com"
            },
            {
                email_verification_required_at: new Date(Date.now() - 1000)
            }
        );

        const response = await request(app)
            .get("/calls")
            .set("Cookie", sessionCookie);

        expect(response.status).toBe(403);
        expect(response.body.code).toBe("EMAIL_VERIFICATION_REQUIRED");
    });
});

describe("POST /auth/refresh", () => {
    test("extends a valid session and returns the safe user profile", async () => {
        const signupResponse = await request(app).post("/auth/signup").send({
            name: "Refresh User",
            email: "refresh@example.com",
            password: "password123"
        });
        const sessionCookie = getSessionCookieHeader(signupResponse);
        const storedSession = await SessionDbModel.findOne({});

        if (!storedSession) {
            throw new Error("Expected a session to refresh");
        }

        const shorterExpiry = new Date(Date.now() + 60 * 1000);

        await SessionDbModel.updateOne(
            {
                _id: storedSession._id
            },
            {
                expires_at: shorterExpiry
            }
        );

        const response = await request(app)
            .post("/auth/refresh")
            .set("Cookie", sessionCookie);
        const refreshedSession = await SessionDbModel.findById(
            storedSession._id
        );

        expect(response.status).toBe(200);
        expect(response.body.user).toMatchObject({
            name: "Refresh User",
            email: "refresh@example.com"
        });
        expect(
            new Date(response.body.sessionExpiresAt).getTime()
        ).toBeGreaterThan(shorterExpiry.getTime());
        expect(refreshedSession?.expires_at.getTime()).toBeGreaterThan(
            shorterExpiry.getTime()
        );
        expect(getSessionSetCookie(response)).toContain("HttpOnly");
    });

    test("returns 401 when the session cookie is missing", async () => {
        const response = await request(app).post("/auth/refresh");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Session cookie is required");
    });

    test("returns 403 when refreshing an expired unverified account", async () => {
        const signupResponse = await request(app).post("/auth/signup").send({
            name: "Expired Refresh Verification User",
            email: "expired-refresh-verification@example.com",
            password: "password123"
        });
        const sessionCookie = getSessionCookieHeader(signupResponse);

        await UserDbModel.updateOne(
            {
                email: "expired-refresh-verification@example.com"
            },
            {
                email_verification_required_at: new Date(Date.now() - 1000)
            }
        );

        const response = await request(app)
            .post("/auth/refresh")
            .set("Cookie", sessionCookie);

        expect(response.status).toBe(403);
        expect(response.body.code).toBe("EMAIL_VERIFICATION_REQUIRED");
    });
});

describe("POST /auth/logout", () => {
    test("deletes the session and clears the cookie", async () => {
        const signupResponse = await request(app).post("/auth/signup").send({
            name: "Logout User",
            email: "logout@example.com",
            password: "password123"
        });
        const sessionCookie = getSessionCookieHeader(signupResponse);

        const logoutResponse = await request(app)
            .post("/auth/logout")
            .set("Cookie", sessionCookie);
        const protectedResponse = await request(app)
            .get("/calls")
            .set("Cookie", sessionCookie);

        expect(logoutResponse.status).toBe(200);
        expect(logoutResponse.body.message).toBe("Logged out successfully");
        expect(getSessionSetCookie(logoutResponse)).toContain(
            `${SESSION_COOKIE_NAME}=`
        );
        expect(await SessionDbModel.countDocuments({})).toBe(0);
        expect(protectedResponse.status).toBe(401);
        expect(protectedResponse.body.error).toBe("Invalid session");
    });
});

describe("JWT protected routes", () => {
    test("returns 401 when a protected route has no token", async () => {
        const response = await request(app).get("/calls");

        expect(response.status).toBe(401);
    });

    test("returns 401 when a protected route has an invalid token", async () => {
        const response = await request(app)
            .get("/calls")
            .set("Authorization", "Bearer invalid-token");

        expect(response.status).toBe(401);
    });

    test("returns 401 when a protected route has an expired token", async () => {
        const expiredToken = signAccessToken(
            new mongoose.Types.ObjectId().toString(),
            {
                expiresInSeconds: -60
            }
        );
        const response = await request(app)
            .get("/calls")
            .set("Authorization", `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Token expired");
    });

    test("returns 401 when the token user no longer exists", async () => {
        const deletedUserId = new mongoose.Types.ObjectId().toString();
        const token = signAccessToken(deletedUserId);

        const response = await request(app)
            .get("/calls")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Invalid token");
    });

    test("returns 403 when bearer auth belongs to an expired unverified user", async () => {
        const user = await UserDbModel.create({
            name: "Expired Bearer Verification User",
            email: "expired-bearer-verification@example.com",
            password_hash: "hash",
            password_salt: "salt",
            email_verification_required_at: new Date(Date.now() - 1000)
        });
        const token = signAccessToken(user._id.toString());

        const response = await request(app)
            .get("/calls")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(403);
        expect(response.body.code).toBe("EMAIL_VERIFICATION_REQUIRED");
    });
});
