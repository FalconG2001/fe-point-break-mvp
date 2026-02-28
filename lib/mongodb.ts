import mongoose from "mongoose";
import AdminAllowlist from "@/models/admin-allowlist";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri) throw new Error("Missing MONGODB_URI");
if (!dbName) throw new Error("Missing MONGODB_DB");

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

export async function isAdminAllowed(email: string): Promise<boolean> {
  await connectToDB();
  const found = await AdminAllowlist.findOne({
    email: email.toLowerCase(),
  }).lean();
  return !!found;
}
