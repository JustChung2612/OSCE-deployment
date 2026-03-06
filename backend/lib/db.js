import 'dotenv/config';
import mongoose from "mongoose";


// Local
export const connectDB_local = async () => {
    try{

        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch(error) {
        console.log("Error connecting to MONGODB", error.message);
    }
}

// Cloud

export const connectDB_atlas = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Atlas connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

