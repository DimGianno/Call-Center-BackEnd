import dotenv from "dotenv";
import mongoose from "mongoose";
import { generateMockCalls } from "./mockCalls.js";
import { CallDbModel } from "./models/callDbModel.js";

dotenv.config();

const runSeed = async () => {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error("MONGODB_URI is missing from environment variables");
    }

    try {
        await mongoose.connect(mongoUri);

        const mockCalls = generateMockCalls(150);

        await CallDbModel.deleteMany({});
        await CallDbModel.insertMany(mockCalls);

        console.log(`Seeded ${mockCalls.length} calls successfully`);
    } catch (error) {
        console.error("Failed to seed database", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

runSeed();
