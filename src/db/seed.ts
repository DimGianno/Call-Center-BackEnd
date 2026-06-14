import dotenv from "dotenv";
import mongoose from "mongoose";
import { CallDbModel } from "./models/callDbModel.js";
import { UserDbModel } from "./models/userDbModel.js";
import { hashPassword } from "../utils/password.js";

dotenv.config();

const demoUserEmail = "demo@example.com";
const demoUserPassword = "password123";

const directions = ["inbound", "outbound"] as const;
const callTypes = ["answered", "missed", "voicemail"] as const;

const noteTemplates = [
    "Customer asked about pricing plan",
    "Customer requested a callback",
    "Customer reported an account access issue",
    "Customer asked for billing clarification",
    "Customer wanted more information about available services",
    "Customer asked to update contact details",
    "Customer requested technical support",
    "Customer asked about cancellation policy",
    "Customer wanted to speak with a supervisor",
    "Customer left a follow-up question"
];

const generatePhoneNumber = (index: number): string => {
    const baseNumber = 600000000 + index;
    return `+33${baseNumber}`;
};

const generateNotes = (callIndex: number) => {
    const noteCount = callIndex % 4; // 0 to 3 notes

    return Array.from({ length: noteCount }, (_, noteIndex) => ({
        content: noteTemplates[(callIndex + noteIndex) % noteTemplates.length]
    }));
};

const generateMockCalls = (count: number, userId: mongoose.Types.ObjectId) => {
    return Array.from({ length: count }, (_, index) => {
        const callNumber = index + 1;
        const direction = directions[index % directions.length];
        const call_type = callTypes[index % callTypes.length];

        return {
            user_id: userId,
            direction,
            from:
                direction === "inbound"
                    ? generatePhoneNumber(callNumber)
                    : "+33123456789",
            to:
                direction === "inbound"
                    ? "+33123456789"
                    : generatePhoneNumber(callNumber),
            call_type,
            duration:
                call_type === "missed" ? 0 : 30 + ((callNumber * 17) % 420),
            is_archived: callNumber % 5 === 0,
            created_at: new Date(
                Date.UTC(
                    2025,
                    3,
                    1 + (index % 28),
                    8 + (index % 10),
                    (index * 7) % 60,
                    0
                )
            ),
            notes: generateNotes(callNumber)
        };
    });
};

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
        console.log(`Demo user password: ${demoUserPassword}`);
    } catch (error) {
        console.error("Failed to seed database", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

runSeed();
