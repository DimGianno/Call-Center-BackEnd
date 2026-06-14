import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../app.js";
import { CallDbModel } from "../db/models/callDbModel.js";
import { UserDbModel, type UserDocument } from "../db/models/userDbModel.js";
import { signAccessToken } from "../utils/jwt.js";

type CallResponse = {
    id: string;
    direction: "inbound" | "outbound";
    call_type: "answered" | "missed" | "voicemail";
    is_archived: boolean;
    notes?: Array<{
        content: string;
    }>;
};

let mongoServer: MongoMemoryServer;
let seededCalls: Awaited<ReturnType<typeof CallDbModel.create>>;
let primaryUser: UserDocument;
let otherUser: UserDocument;
let authHeader: string;
let otherUserActiveCallId: string;
let otherUserArchivedCallId: string;

const getWithAuth = (url: string) => {
    return request(app).get(url).set("Authorization", authHeader);
};

const patchWithAuth = (url: string) => {
    return request(app).patch(url).set("Authorization", authHeader);
};

const postWithAuth = (url: string) => {
    return request(app).post(url).set("Authorization", authHeader);
};

const deleteWithAuth = (url: string) => {
    return request(app).delete(url).set("Authorization", authHeader);
};

beforeAll(async () => {
    process.env.JWT_SECRET = "test-jwt-secret";
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
    await CallDbModel.deleteMany({});
    await UserDbModel.deleteMany({});

    primaryUser = await UserDbModel.create({
        name: "Primary User",
        email: "primary@example.com",
        password_hash: "hash",
        password_salt: "salt"
    });

    otherUser = await UserDbModel.create({
        name: "Other User",
        email: "other@example.com",
        password_hash: "hash",
        password_salt: "salt"
    });

    authHeader = `Bearer ${signAccessToken(primaryUser._id.toString())}`;

    seededCalls = await CallDbModel.create([
        {
            user_id: primaryUser._id,
            direction: "inbound",
            from: "+306900000001",
            to: "+302310000001",
            call_type: "answered",
            duration: 120,
            is_archived: false,
            created_at: new Date("2026-01-01T10:00:00.000Z"),
            notes: [
                {
                    content: "Customer asked about billing."
                }
            ]
        },
        {
            user_id: primaryUser._id,
            direction: "outbound",
            from: "+302310000001",
            to: "+306900000002",
            call_type: "missed",
            duration: 0,
            is_archived: false,
            created_at: new Date("2026-01-01T11:00:00.000Z"),
            notes: []
        },
        {
            user_id: primaryUser._id,
            direction: "outbound",
            from: "+302310000001",
            to: "+306900000002",
            call_type: "missed",
            duration: 0,
            is_archived: true,
            created_at: new Date("2026-01-01T11:00:00.000Z"),
            notes: []
        },
        {
            user_id: primaryUser._id,
            direction: "inbound",
            from: "+306900000004",
            to: "+302310000001",
            call_type: "missed",
            duration: 0,
            is_archived: false,
            created_at: new Date("2026-01-01T13:00:00.000Z"),
            notes: []
        },
        {
            user_id: otherUser._id,
            direction: "inbound",
            from: "+306900000005",
            to: "+302310000001",
            call_type: "answered",
            duration: 30,
            is_archived: false,
            created_at: new Date("2026-01-01T14:00:00.000Z"),
            notes: []
        },
        {
            user_id: otherUser._id,
            direction: "outbound",
            from: "+302310000001",
            to: "+306900000006",
            call_type: "voicemail",
            duration: 45,
            is_archived: true,
            created_at: new Date("2026-01-01T15:00:00.000Z"),
            notes: []
        }
    ]);

    otherUserActiveCallId = seededCalls[4]._id.toString();
    otherUserArchivedCallId = seededCalls[5]._id.toString();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("GET /calls", () => {
    test("returns a list of active calls by default", async () => {
        const response = await getWithAuth("/calls");

        expect(response.status).toBe(200);
        expect(response.body.calls).toBeInstanceOf(Array);
        expect(response.body.calls.length).toBe(3);
        expect(
            response.body.calls.map((call: CallResponse) => call.id)
        ).not.toContain(otherUserActiveCallId);
    });
});

describe("GET /calls query filters", () => {
    test("returns archived calls when is_archived=true", async () => {
        const response = await getWithAuth("/calls?is_archived=true");

        expect(response.status).toBe(200);
        expect(response.body.calls).toBeInstanceOf(Array);
        expect(response.body.calls.length).toBe(1);

        expect(
            response.body.calls.every(
                (call: CallResponse) => call.is_archived === true
            )
        ).toBe(true);
    });

    test("returns calls filtered by direction", async () => {
        const response = await getWithAuth("/calls?direction=inbound");

        expect(response.status).toBe(200);
        expect(response.body.calls).toBeInstanceOf(Array);
        expect(response.body.calls.length).toBe(2);

        expect(response.body.calls[0]).toMatchObject({
            direction: "inbound",
            is_archived: false
        });
    });

    test("returns calls filtered by direction and call_type", async () => {
        const response = await getWithAuth(
            "/calls?direction=inbound&call_type=missed"
        );

        expect(response.status).toBe(200);
        expect(response.body.calls).toBeInstanceOf(Array);
        expect(response.body.calls.length).toBe(1);

        expect(response.body.calls[0]).toMatchObject({
            direction: "inbound",
            call_type: "missed",
            is_archived: false
        });
    });

    test("returns 400 for an invalid direction filter", async () => {
        const response = await getWithAuth(
            "/calls?direction=inboundd&call_type=missed"
        );

        expect(response.status).toBe(400);
    });

    test("returns 400 when limit is too high", async () => {
        const response = await getWithAuth("/calls?limit=500");

        expect(response.status).toBe(400);
    });

    test("returns 400 when page is less than 1", async () => {
        const response = await getWithAuth("/calls?page=0&limit=1");

        expect(response.status).toBe(400);
    });

    test("returns 200 when pagination happy path", async () => {
        const response = await getWithAuth("/calls?page=1&limit=1");

        expect(response.status).toBe(200);
        expect(response.body.calls.length).toBe(1);
    });
});

describe("GET /calls/:callId", () => {
    test("returns the correct call with its notes", async () => {
        const callId = seededCalls[0]._id.toString();

        const response = await getWithAuth(`/calls/${callId}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(callId);
        expect(response.body.direction).toBe("inbound");
        expect(response.body.notes).toBeInstanceOf(Array);
        expect(response.body.notes.length).toBe(1);
        expect(response.body.notes[0].content).toBe(
            "Customer asked about billing."
        );
    });

    test("returns 404 for a non-existent call", async () => {
        const nonExistentCallId = new mongoose.Types.ObjectId().toString();

        const response = await getWithAuth(`/calls/${nonExistentCallId}`);

        expect(response.status).toBe(404);
    });

    test("returns 400 for an invalid id format", async () => {
        const response = await getWithAuth(`/calls/999`);

        expect(response.status).toBe(400);
    });
});

describe("call ownership", () => {
    test("returns 404 when fetching another user's call", async () => {
        const response = await getWithAuth(`/calls/${otherUserActiveCallId}`);

        expect(response.status).toBe(404);
    });

    test("returns 404 when mutating another user's calls", async () => {
        const archiveResponse = await patchWithAuth(
            `/calls/${otherUserActiveCallId}/archive`
        );
        const unarchiveResponse = await patchWithAuth(
            `/calls/${otherUserArchivedCallId}/unarchive`
        );
        const noteResponse = await postWithAuth(
            `/calls/${otherUserActiveCallId}/notes`
        ).send({
            content: "This should not be added."
        });
        const deleteResponse = await deleteWithAuth(
            `/calls/${otherUserActiveCallId}`
        );

        const otherActiveCall = await CallDbModel.findById(
            otherUserActiveCallId
        );
        const otherArchivedCall = await CallDbModel.findById(
            otherUserArchivedCallId
        );

        expect(archiveResponse.status).toBe(404);
        expect(unarchiveResponse.status).toBe(404);
        expect(noteResponse.status).toBe(404);
        expect(deleteResponse.status).toBe(404);
        expect(otherActiveCall).not.toBeNull();
        expect(otherActiveCall?.is_archived).toBe(false);
        expect(otherActiveCall?.notes.length).toBe(0);
        expect(otherArchivedCall).not.toBeNull();
        expect(otherArchivedCall?.is_archived).toBe(true);
    });
});

describe("PATCH /calls/:callId/archive", () => {
    test("archives a call", async () => {
        const callId = seededCalls[0]._id.toString();

        const response = await patchWithAuth(`/calls/${callId}/archive`);

        const updatedCall = await CallDbModel.findById(callId);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(callId);
        expect(response.body.is_archived).toBe(true);

        expect(updatedCall).not.toBeNull();
        expect(updatedCall?.is_archived).toBe(true);
    });

    test("returns 404 for a non-existent call", async () => {
        const nonExistentCallId = new mongoose.Types.ObjectId().toString();

        const response = await patchWithAuth(
            `/calls/${nonExistentCallId}/archive`
        );

        expect(response.status).toBe(404);
    });

    test("returns 400 for an invalid id format", async () => {
        const response = await patchWithAuth("/calls/999/archive");

        expect(response.status).toBe(400);
    });
});

describe("PATCH /calls/:callId/unarchive", () => {
    test("unarchives a call", async () => {
        const callId = seededCalls[2]._id.toString();

        const response = await patchWithAuth(`/calls/${callId}/unarchive`);

        const updatedCall = await CallDbModel.findById(callId);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(callId);
        expect(response.body.is_archived).toBe(false);

        expect(updatedCall).not.toBeNull();
        expect(updatedCall?.is_archived).toBe(false);
    });

    test("returns 404 for a non-existent call", async () => {
        const nonExistentCallId = new mongoose.Types.ObjectId().toString();

        const response = await patchWithAuth(
            `/calls/${nonExistentCallId}/unarchive`
        );

        expect(response.status).toBe(404);
    });

    test("returns 400 for an invalid id format", async () => {
        const response = await patchWithAuth("/calls/999/unarchive");

        expect(response.status).toBe(400);
    });
});

describe("PATCH /calls/archive-all", () => {
    test("archives all calls", async () => {
        const response = await patchWithAuth("/calls/archive-all");

        const primaryUserCalls = await CallDbModel.find({
            user_id: primaryUser._id
        });
        const otherUserActiveCall = await CallDbModel.findById(
            otherUserActiveCallId
        );

        expect(response.status).toBe(200);
        expect(response.body.modifiedCount).toBe(3);
        expect(primaryUserCalls.length).toBe(4);
        expect(
            primaryUserCalls.every((call) => call.is_archived === true)
        ).toBe(true);
        expect(otherUserActiveCall?.is_archived).toBe(false);
    });
});

describe("PATCH /calls/unarchive-all", () => {
    test("unarchives all calls", async () => {
        const response = await patchWithAuth("/calls/unarchive-all");

        const primaryUserCalls = await CallDbModel.find({
            user_id: primaryUser._id
        });
        const otherUserArchivedCall = await CallDbModel.findById(
            otherUserArchivedCallId
        );

        expect(response.status).toBe(200);
        expect(response.body.modifiedCount).toBe(1);
        expect(primaryUserCalls.length).toBe(4);
        expect(
            primaryUserCalls.every((call) => call.is_archived === false)
        ).toBe(true);
        expect(otherUserArchivedCall?.is_archived).toBe(true);
    });
});

describe("POST /calls/:callId/notes", () => {
    test("adds a note to a call", async () => {
        const callId = seededCalls[1]._id.toString();

        const response = await postWithAuth(`/calls/${callId}/notes`).send({
            content: "Customer needs a follow-up call."
        });

        const updatedCall = await CallDbModel.findById(callId);

        expect(response.status).toBe(201);
        expect(response.body.id).toBe(callId);
        expect(response.body.notes).toBeInstanceOf(Array);
        expect(response.body.notes).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    content: "Customer needs a follow-up call."
                })
            ])
        );

        expect(updatedCall).not.toBeNull();
        expect(
            updatedCall?.notes.some(
                (note) => note.content === "Customer needs a follow-up call."
            )
        ).toBe(true);
    });

    test("returns 404 for a non-existent call", async () => {
        const nonExistentCallId = new mongoose.Types.ObjectId().toString();

        const response = await postWithAuth(
            `/calls/${nonExistentCallId}/notes`
        ).send({
            content: "This note should not be added."
        });

        expect(response.status).toBe(404);
    });

    test("returns 400 for an invalid id format", async () => {
        const response = await postWithAuth("/calls/999/notes").send({
            content: "This note should not be added."
        });

        expect(response.status).toBe(400);
    });

    test("returns 400 for an empty note", async () => {
        const callId = seededCalls[1]._id.toString();

        const response = await postWithAuth(`/calls/${callId}/notes`).send({
            content: " "
        });

        expect(response.status).toBe(400);
    });

    test("returns 400 when note content is missing", async () => {
        const callId = seededCalls[1]._id.toString();

        const response = await postWithAuth(`/calls/${callId}/notes`).send({});

        expect(response.status).toBe(400);
    });
});

describe("DELETE /calls/:callId", () => {
    test("deletes a call", async () => {
        const callId = seededCalls[0]._id.toString();

        const response = await deleteWithAuth(`/calls/${callId}`);

        const deletedCall = await CallDbModel.findById(callId);

        expect(response.status).toBe(200);
        expect(deletedCall).toBeNull();
    });

    test("returns 404 for a non-existent call", async () => {
        const nonExistentCallId = new mongoose.Types.ObjectId().toString();

        const response = await deleteWithAuth(`/calls/${nonExistentCallId}`);

        expect(response.status).toBe(404);
    });

    test("returns 400 for an invalid id format", async () => {
        const response = await deleteWithAuth("/calls/999");

        expect(response.status).toBe(400);
    });
});
