import mongoose from "mongoose";
import CONFIG from "./config";

const connectDb = async () => {
    try {
        await mongoose.connect(CONFIG.MONGO_URI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("Mongodb connection error: ", error);
    }
}

export default connectDb;