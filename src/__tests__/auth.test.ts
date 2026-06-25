import request, { type Response } from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../app.js";
import { SessionDbModel } from "../db/models/sessionDbModel.js";
import { UserDbModel } from "../db/models/userDbModel.js";
import { hashSessionToken } from "../services/sessionService.js";
import { signAccessToken } from "../utils/jwt.js";
import { SESSION_COOKIE_NAME } from "../utils/sessionCookie.js";

type AuthResponseBody = {
    user: {
        id: string;
        name: string;
        email: string;
        created_at: string;
        password_hash?: string;
        password_salt?: string;
    };
    accessToken: string;
    sessionExpiresAt: string;
};

let mongoServer: MongoMemoryServer;

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

beforeAll(async () => {
    process.env.JWT_SECRET = "test-jwt-secret";
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
    await SessionDbModel.deleteMany({});
    await UserDbModel.deleteMany({});
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
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
        expect(storedSession).not.toBeNull();
        expect(storedSession?.token_hash).toHaveLength(64);
        expect(storedSession?.expires_at.toISOString()).toBe(
            responseBody.sessionExpiresAt
        );
        expect(sessionSetCookie).toContain("HttpOnly");
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
});
