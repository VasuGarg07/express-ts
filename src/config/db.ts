import mongoose from "mongoose";

const connectDb = async () => {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/boilerplate';
    try {
        await mongoose.connect(mongoURI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("Mongodb connection error: ", error);
    }
}

export default connectDb;