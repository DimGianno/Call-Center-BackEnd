import dotenv from "dotenv";
import mongoose from "mongoose";
import { CallDbModel } from "./models/callDbModel.js";

dotenv.config();

const seedCalls = [
  {
    direction: "inbound",
    from: "+33612345678",
    to: "+33123456789",
    call_type: "answered",
    duration: 120,
    is_archived: false,
    created_at: new Date("2025-04-10T14:32:00Z"),
    notes: [
      {
        content: "Customer asked about pricing plan",
      },
    ],
  },
  {
    direction: "outbound",
    from: "+33123456789",
    to: "+33687654321",
    call_type: "missed",
    duration: 0,
    is_archived: false,
    created_at: new Date("2025-04-11T09:15:00Z"),
    notes: [],
  },
  {
    direction: "inbound",
    from: "+33655554444",
    to: "+33123456789",
    call_type: "voicemail",
    duration: 45,
    is_archived: true,
    created_at: new Date("2025-04-12T17:05:00Z"),
    notes: [
      {
        content: "Customer left voicemail about account access",
      },
    ],
  },
];

const runSeed = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing from environment variables");
  }

  try {
    await mongoose.connect(mongoUri);

    await CallDbModel.deleteMany({});
    await CallDbModel.insertMany(seedCalls);

    console.log(`Seeded ${seedCalls.length} calls successfully`);
  } catch (error) {
    console.error("Failed to seed database", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

runSeed();