import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) throw new Error("Missing MONGODB_URI");

export const connectToDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
};
