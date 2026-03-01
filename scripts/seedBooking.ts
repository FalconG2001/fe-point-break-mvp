import booking from "@/models/booking";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) throw new Error("Missing MONGODB_URI");

async function main() {
  await mongoose.connect(uri!);
  console.log("✅ Connected");

  const count = await booking.countDocuments();
  console.log(`Found ${count} bookings`);

  try {
    await booking.updateMany(
      {},
      {
        $set: { "customer.userType": "student" },
      },
    );

    console.log(`✅ Updated ${count} bookings`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  await mongoose.disconnect();
  console.log("✅ Disconnected");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
