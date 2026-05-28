import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../app.js";
import { CallDbModel } from "../db/models/callDbModel.js"

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
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("GET /calls", () => {
  test("returns a list of calls", async () => {
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
});