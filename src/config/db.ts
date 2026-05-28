import mongoose from "mongoose";

export const connectToDatabase = async () => {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error("MONGODB_URI is missing from enviroment variables");
    }

    await mongoose.connect(mongoUri);

    console.log("Connected to MongoDB");
};
