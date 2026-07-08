import type { UserDocument } from "../db/models/userDbModel.js";
import type { User } from "../models/userModel.js";

export const mapUserDocumentToUser = (user: UserDocument): User => {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        email_verified_at: user.email_verified_at?.toISOString() ?? null,
        email_verification_required_at:
            user.email_verification_required_at?.toISOString() ?? null,
        email_verification_sent_at:
            user.email_verification_sent_at?.toISOString() ?? null,
        created_at: user.created_at.toISOString()
    };
};
