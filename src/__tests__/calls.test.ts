import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../app.js";
import { CallDbModel } from "../db/models/callDbModel.js";

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
    {
      direction: "inbound",
      from: "+306900000004",
      to: "+302310000001",
      call_type: "missed",
      duration: 0,
      is_archived: false,
      created_at: new Date("2026-01-01T13:00:00.000Z"),
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
    expect(response.body.calls.length).toBe(3);
  });
});

describe("GET /calls query filters", () => {
  test("returns archived calls when is_archived=true", async () => {
    const response = await request(app).get("/calls?is_archived=true");

    expect(response.status).toBe(200);
    expect(response.body.calls).toBeInstanceOf(Array);
    expect(response.body.calls.length).toBe(1);

    expect(
      response.body.calls.every((call: CallResponse) => call.is_archived === true)
    ).toBe(true);
  });

  test("returns calls filtered by direction", async () => {
    const response = await request(app).get(
      "/calls?direction=inbound"
    );

    expect(response.status).toBe(200);
    expect(response.body.calls).toBeInstanceOf(Array);
    expect(response.body.calls.length).toBe(2);

    expect(response.body.calls[0]).toMatchObject({
      direction: "inbound",
      is_archived: false,
    });
  });  

  test("returns calls filtered by direction and call_type", async () => {
    const response = await request(app).get(
      "/calls?direction=inbound&call_type=missed"
    );

    expect(response.status).toBe(200);
    expect(response.body.calls).toBeInstanceOf(Array);
    expect(response.body.calls.length).toBe(1);

    expect(response.body.calls[0]).toMatchObject({
      direction: "inbound",
      call_type: "missed",
      is_archived: false,
    });
  });

  test("returns 400 for an invalid direction filter", async () => {
    const response = await request(app).get(
      "/calls?direction=inboundd&call_type=missed"
    );

    expect(response.status).toBe(400);
  });

  test("returns 400 when limit is too high", async () => {
    const response = await request(app).get("/calls?limit=500");

    expect(response.status).toBe(400);
  });

  test("returns 400 when page is less than 1", async () => {
    const response = await request(app).get("/calls?page=0&limit=1");

    expect(response.status).toBe(400);
  });

  test("returns 200 when pagination happy path", async () => {
    const response = await request(app).get("/calls?page=1&limit=1");

    expect(response.status).toBe(200);
    expect(response.body.calls.length).toBe(1);
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

describe("PATCH /calls/archive-all", () => {
  test("archives all calls", async () => {
    const response = await request(app).patch("/calls/archive-all");

    const calls = await CallDbModel.find({});

    expect(response.status).toBe(200);
    expect(calls.length).toBe(4);
    expect(calls.every((call) => call.is_archived === true)).toBe(true);
  });
});

describe("PATCH /calls/unarchive-all", () => {
  test("unarchives all calls", async () => {

    const response = await request(app).patch("/calls/unarchive-all");

    const calls = await CallDbModel.find({});

    expect(response.status).toBe(200);
    expect(calls.length).toBe(4);
    expect(calls.every((call) => call.is_archived === false)).toBe(true);
  });
});

describe("POST /calls/:callId/notes", () => {
  test("adds a note to a call", async () => {
    const callId = seededCalls[1]._id.toString();

    const response = await request(app)
      .post(`/calls/${callId}/notes`)
      .send({
        content: "Customer needs a follow-up call.",
      });

    const updatedCall = await CallDbModel.findById(callId);

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(callId);
    expect(response.body.notes).toBeInstanceOf(Array);
    expect(response.body.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          content: "Customer needs a follow-up call.",
        }),
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

    const response = await request(app)
      .post(`/calls/${nonExistentCallId}/notes`)
      .send({
        content: "This note should not be added.",
      });

    expect(response.status).toBe(404);
  });

  test("returns 400 for an invalid id format", async () => {
    const response = await request(app).post("/calls/999/notes").send({
      content: "This note should not be added.",
    });

    expect(response.status).toBe(400);
  });

  test("returns 400 for an empty note", async () => {
    const response = await request(app).post("/calls/999/notes").send({
      content: " ",
    });

    expect(response.status).toBe(400);
  });

  test("returns 400 when note content is missing", async () => {
    const callId = seededCalls[1]._id.toString();

    const response = await request(app).post(`/calls/${callId}/notes`).send({});

    expect(response.status).toBe(400);
  });
});

describe("DELETE /calls/:callId", () => {
  test("deletes a call", async () => {
    const callId = seededCalls[0]._id.toString();

    const response = await request(app).delete(`/calls/${callId}`);

    const deletedCall = await CallDbModel.findById(callId);

    expect(response.status).toBe(200);
    expect(deletedCall).toBeNull();
  });

  test("returns 404 for a non-existent call", async () => {
    const nonExistentCallId = new mongoose.Types.ObjectId().toString();

    const response = await request(app).delete(`/calls/${nonExistentCallId}`);

    expect(response.status).toBe(404);
  });

  test("returns 400 for an invalid id format", async () => {
    const response = await request(app).delete("/calls/999");

    expect(response.status).toBe(400);
  });
});
