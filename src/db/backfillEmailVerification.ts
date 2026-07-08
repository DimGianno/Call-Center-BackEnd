import dotenv from "dotenv";

import { connectToDatabase } from "../config/db.js";
import { UserDbModel } from "./models/userDbModel.js";
import { getEmailVerificationRequiredAt } from "../services/emailVerificationService.js";

dotenv.config();

const backfillEmailVerification = async () => {
    await connectToDatabase();

    const requiredAt = getEmailVerificationRequiredAt();
    const result = await UserDbModel.updateMany(
        {
            email_verified_at: {
                $in: [null, undefined]
            },
            email_verification_required_at: {
                $in: [null, undefined]
            }
        } as Record<string, unknown>,
        {
            $set: {
                email_verification_required_at: requiredAt
            }
        }
    );

    console.log(
        `Email verification backfill complete. Matched ${result.matchedCount}, modified ${result.modifiedCount}.`
    );
};

backfillEmailVerification()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Email verification backfill failed", error);
        process.exit(1);
    });
