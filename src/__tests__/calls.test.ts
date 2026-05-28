import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../app.js";
import { CallDbModel } from "../db/models/callDbModel.js";

let mongoServer: MongoMemoryServer;
let seededCalls: Awaited<ReturnType<typeof CallDbModel.create>>;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await CallDbModel.deleteMany({});

  seededCalls = await CallDbModel.create([
    {
      direction: "inbound",
      from: "+306900000001",
      to: "+302310000001",
      call_type: "answered",
      duration: 120,
      is_archived: false,
      created_at: new Date("2026-01-01T10:00:00.000Z"),
      notes: [
        {
          content: "Customer asked about billing.",
        },
      ],
    },
    {
      direction: "outbound",
      from: "+302310000001",
      to: "+306900000002",
      call_type: "missed",
      duration: 0,
      is_archived: false,
      created_at: new Date("2026-01-01T11:00:00.000Z"),
      notes: [],
    },
    {
      direction: "outbound",
      from: "+302310000001",
      to: "+306900000002",
      call_type: "missed",
      duration: 0,
      is_archived: true,
      created_at: new Date("2026-01-01T11:00:00.000Z"),
      notes: [],
    },
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("GET /calls", () => {
  test("returns a list of active calls by default", async () => {
    const response = await request(app).get("/calls");

    expect(response.status).toBe(200);
    expect(response.body.calls).toBeInstanceOf(Array);
    expect(response.body.calls.length).toBe(2);
  });
});

describe("GET /calls/:callId", () => {
  test("returns the correct call with its notes", async () => {
    const callId = seededCalls[0]._id.toString();

    const response = await request(app).get(`/calls/${callId}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(callId);
    expect(response.body.direction).toBe("inbound");
    expect(response.body.notes).toBeInstanceOf(Array);
    expect(response.body.notes.length).toBe(1);
    expect(response.body.notes[0].content).toBe("Customer asked about billing.");
  });

  test("returns 404 for a non-existent call", async () => {
      const nonExistentCallId = new mongoose.Types.ObjectId().toString();

      const response = await request(app).get(`/calls/${nonExistentCallId}`);

      expect(response.status).toBe(404);
  });  

  test("returns 400 for an invalid id format", async () => {
      const response = await request(app).get(`/calls/999`);

      expect(response.status).toBe(400);
  });  

});

describe("PATCH /calls/:callId/archive", () => {
  test("archives a call", async () => {
    const callId = seededCalls[0]._id.toString();

    const response = await request(app).patch(`/calls/${callId}/archive`);

    const updatedCall = await CallDbModel.findById(callId);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(callId);
    expect(response.body.is_archived).toBe(true);

    expect(updatedCall).not.toBeNull();
    expect(updatedCall?.is_archived).toBe(true);
  });

  test("returns 404 for a non-existent call", async () => {
    const nonExistentCallId = new mongoose.Types.ObjectId().toString();

    const response = await request(app).patch(
      `/calls/${nonExistentCallId}/archive`
    );

    expect(response.status).toBe(404);
  });

  test("returns 400 for an invalid id format", async () => {
    const response = await request(app).patch("/calls/999/archive");

    expect(response.status).toBe(400);
  });
});

describe("PATCH /calls/:callId/unarchive", () => {
  test("unarchives a call", async () => {
    const callId = seededCalls[2]._id.toString();

    const response = await request(app).patch(`/calls/${callId}/unarchive`);

    const updatedCall = await CallDbModel.findById(callId);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(callId);
    expect(response.body.is_archived).toBe(false);

    expect(updatedCall).not.toBeNull();
    expect(updatedCall?.is_archived).toBe(false);
  });

  test("returns 404 for a non-existent call", async () => {
    const nonExistentCallId = new mongoose.Types.ObjectId().toString();

    const response = await request(app).patch(
      `/calls/${nonExistentCallId}/unarchive`
    );

    expect(response.status).toBe(404);
  });

  test("returns 400 for an invalid id format", async () => {
    const response = await request(app).patch("/calls/999/unarchive");

    expect(response.status).toBe(400);
  });
});
