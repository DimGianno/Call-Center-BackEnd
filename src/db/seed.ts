import dotenv from "dotenv";
import mongoose from "mongoose";
import { generateMockCalls } from "./mockCalls.js";
import { CallDbModel } from "./models/callDbModel.js";
import { UserDbModel } from "./models/userDbModel.js";
import { hashPassword } from "../utils/password.js";

dotenv.config();

const demoUserEmail = "demo@example.com";
const demoUserPassword = "password123";
const runSeed = async () => {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error("MONGODB_URI is missing from environment variables");
    }

    try {
        await mongoose.connect(mongoUri);

        const passwordFields = await hashPassword(demoUserPassword);
        const demoUser = await UserDbModel.findOneAndUpdate(
            { email: demoUserEmail },
            {
                $set: {
                    name: "Demo User",
                    email: demoUserEmail,
                    ...passwordFields
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        if (!demoUser) {
            throw new Error("Failed to create demo user");
        }

        const mockCalls = generateMockCalls(150, demoUser._id);

        await CallDbModel.deleteMany({});
        await CallDbModel.insertMany(mockCalls);

        console.log(`Seeded ${mockCalls.length} calls successfully`);
        console.log(`Demo user email: ${demoUserEmail}`);
        console.log("Demo user password is configured in the seed script");
    } catch (error) {
        console.error("Failed to seed database", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

runSeed();
