import request, { type Response } from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../app.js";
import { SessionDbModel } from "../db/models/sessionDbModel.js";
import { UserDbModel } from "../db/models/userDbModel.js";
import { SESSION_COOKIE_NAME } from "../utils/sessionCookie.js";

let mongoServer: MongoMemoryServer;

const defaultTutorialState = {
    version: 1,
    hasSeenWelcome: false,
    completedAt: null,
    skippedAt: null,
    completedTopics: []
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

const getSessionCookieHeader = (response: Response): string => {
    const sessionSetCookie = getSetCookies(response).find((cookie) =>
        cookie.startsWith(`${SESSION_COOKIE_NAME}=`)
    );

    if (!sessionSetCookie) {
        throw new Error("Expected session Set-Cookie header");
    }

    return sessionSetCookie.split(";")[0];
};

const signupAndGetSessionCookie = async (): Promise<string> => {
    const response = await request(app).post("/auth/signup").send({
        name: "Tutorial User",
        email: "tutorial@example.com",
        password: "password123"
    });

    return getSessionCookieHeader(response);
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

describe("GET /users/me/tutorial", () => {
    test("returns 401 without authentication", async () => {
        const response = await request(app).get("/users/me/tutorial");

        expect(response.status).toBe(401);
    });

    test("returns the default state for a new authenticated user", async () => {
        const sessionCookie = await signupAndGetSessionCookie();

        const response = await request(app)
            .get("/users/me/tutorial")
            .set("Cookie", sessionCookie);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(defaultTutorialState);
    });

    test("returns saved state for an existing authenticated user", async () => {
        const sessionCookie = await signupAndGetSessionCookie();
        const savedTutorialState = {
            version: 1,
            hasSeenWelcome: true,
            completedAt: "2026-07-01T10:00:00.000Z",
            skippedAt: null,
            completedTopics: ["welcome", "calls"]
        };

        await UserDbModel.updateOne(
            {
                email: "tutorial@example.com"
            },
            {
                tutorial: savedTutorialState
            }
        );

        const response = await request(app)
            .get("/users/me/tutorial")
            .set("Cookie", sessionCookie);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(savedTutorialState);
    });

    test("creates the default state when an existing user has no tutorial field", async () => {
        const sessionCookie = await signupAndGetSessionCookie();

        await UserDbModel.updateOne(
            {
                email: "tutorial@example.com"
            },
            {
                $unset: {
                    tutorial: ""
                }
            }
        );

        const response = await request(app)
            .get("/users/me/tutorial")
            .set("Cookie", sessionCookie);
        const storedUser = await UserDbModel.findOne({
            email: "tutorial@example.com"
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual(defaultTutorialState);
        expect(storedUser?.tutorial).toMatchObject(defaultTutorialState);
    });
});

describe("PATCH /users/me/tutorial", () => {
    test("returns 401 without authentication", async () => {
        const response = await request(app).patch("/users/me/tutorial").send({
            hasSeenWelcome: true
        });

        expect(response.status).toBe(401);
    });

    test("updates partial tutorial fields and returns the full state", async () => {
        const sessionCookie = await signupAndGetSessionCookie();

        const patchResponse = await request(app)
            .patch("/users/me/tutorial")
            .set("Cookie", sessionCookie)
            .send({
                hasSeenWelcome: true,
                completedAt: "2026-07-01T10:00:00+03:00",
                completedTopics: [" welcome ", "calls"]
            });
        const getResponse = await request(app)
            .get("/users/me/tutorial")
            .set("Cookie", sessionCookie);
        const storedUser = await UserDbModel.findOne({
            email: "tutorial@example.com"
        });

        expect(patchResponse.status).toBe(200);
        expect(patchResponse.body).toEqual({
            version: 1,
            hasSeenWelcome: true,
            completedAt: "2026-07-01T07:00:00.000Z",
            skippedAt: null,
            completedTopics: ["welcome", "calls"]
        });
        expect(getResponse.status).toBe(200);
        expect(getResponse.body).toEqual(patchResponse.body);
        expect(storedUser?.tutorial).toMatchObject(patchResponse.body);
    });

    test("updates skippedAt to null without changing other fields", async () => {
        const sessionCookie = await signupAndGetSessionCookie();
        const skippedAt = "2026-07-01T10:00:00.000Z";

        await request(app)
            .patch("/users/me/tutorial")
            .set("Cookie", sessionCookie)
            .send({
                hasSeenWelcome: true,
                skippedAt
            });

        const response = await request(app)
            .patch("/users/me/tutorial")
            .set("Cookie", sessionCookie)
            .send({
                skippedAt: null
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            ...defaultTutorialState,
            hasSeenWelcome: true,
            skippedAt: null
        });
    });

    test("returns 400 when version is not an integer", async () => {
        const sessionCookie = await signupAndGetSessionCookie();

        const response = await request(app)
            .patch("/users/me/tutorial")
            .set("Cookie", sessionCookie)
            .send({
                version: 1.5
            });

        expect(response.status).toBe(400);
    });

    test("returns 400 when hasSeenWelcome is not a boolean", async () => {
        const sessionCookie = await signupAndGetSessionCookie();

        const response = await request(app)
            .patch("/users/me/tutorial")
            .set("Cookie", sessionCookie)
            .send({
                hasSeenWelcome: "yes"
            });

        expect(response.status).toBe(400);
    });

    test("returns 400 when completedAt is not an ISO date string or null", async () => {
        const sessionCookie = await signupAndGetSessionCookie();

        const response = await request(app)
            .patch("/users/me/tutorial")
            .set("Cookie", sessionCookie)
            .send({
                completedAt: "tomorrow"
            });

        expect(response.status).toBe(400);
    });

    test("returns 400 when completedTopics is not an array of strings", async () => {
        const sessionCookie = await signupAndGetSessionCookie();

        const response = await request(app)
            .patch("/users/me/tutorial")
            .set("Cookie", sessionCookie)
            .send({
                completedTopics: ["welcome", 123]
            });

        expect(response.status).toBe(400);
    });

    test("returns 400 for unknown fields", async () => {
        const sessionCookie = await signupAndGetSessionCookie();

        const response = await request(app)
            .patch("/users/me/tutorial")
            .set("Cookie", sessionCookie)
            .send({
                completed: true
            });

        expect(response.status).toBe(400);
    });

    test("returns 400 when no tutorial fields are provided", async () => {
        const sessionCookie = await signupAndGetSessionCookie();

        const response = await request(app)
            .patch("/users/me/tutorial")
            .set("Cookie", sessionCookie)
            .send({});

        expect(response.status).toBe(400);
    });
});
