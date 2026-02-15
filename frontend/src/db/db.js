import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const DB = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected: ${DB.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
}

export default connectDB;