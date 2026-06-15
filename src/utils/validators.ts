import mongoose from "mongoose";

export const isValidMongoObjectId = (id: string): boolean => {
    return mongoose.Types.ObjectId.isValid(id);
};
