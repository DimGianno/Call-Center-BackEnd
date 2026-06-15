import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../app.js";
import { UserDbModel } from "../db/models/userDbModel.js";
import { signAccessToken } from "../utils/jwt.js";

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
};

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    process.env.JWT_SECRET = "test-jwt-secret";
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
    await UserDbModel.deleteMany({});
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("POST /auth/signup", () => {
    test("creates a user and returns a safe profile with an access token", async () => {
        const response = await request(app).post("/auth/signup").send({
            name: "Dimitrios",
            email: "USER@example.com",
            password: "password123"
        });
        const responseBody = response.body as AuthResponseBody;
        const storedUser = await UserDbModel.findOne({
            email: "user@example.com"
        });

        expect(response.status).toBe(201);
        expect(responseBody.user).toMatchObject({
            name: "Dimitrios",
            email: "user@example.com"
        });
        expect(typeof responseBody.user.id).toBe("string");
        expect(typeof responseBody.user.created_at).toBe("string");
        expect(typeof responseBody.accessToken).toBe("string");
        expect(responseBody.user.password_hash).toBeUndefined();
        expect(responseBody.user.password_salt).toBeUndefined();

        expect(storedUser).not.toBeNull();
        expect(storedUser?.password_hash).not.toBe("password123");
        expect(storedUser?.password_salt).toBeTruthy();
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
    test("logs in a user and returns a safe profile with an access token", async () => {
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
        expect(responseBody.user.password_hash).toBeUndefined();
        expect(responseBody.user.password_salt).toBeUndefined();
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
