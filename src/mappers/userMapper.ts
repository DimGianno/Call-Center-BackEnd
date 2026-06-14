import type { UserDocument } from "../db/models/userDbModel.js";
import type { User } from "../models/userModel.js";

export const mapUserDocumentToUser = (user: UserDocument): User => {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        created_at: user.created_at.toISOString()
    };
};
