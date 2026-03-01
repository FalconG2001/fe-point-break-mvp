import booking from "@/models/booking";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) throw new Error("Missing MONGODB_URI");

async function main() {
  await mongoose.connect(uri!);
  console.log("✅ Connected");

  const result = await booking.aggregate([
    // 1️⃣ Normalize payments into array
    {
      $addFields: {
        paymentsArray: {
          $cond: [
            { $isArray: "$payments" },
            "$payments",
            [{ $ifNull: ["$payments", null] }],
          ],
        },
      },
    },

    // 2️⃣ Unwind payments
    {
      $unwind: {
        path: "$paymentsArray",
        preserveNullAndEmptyArrays: false,
      },
    },

    // 3️⃣ Convert date string to real Date
    {
      $addFields: {
        dateObj: {
          $dateFromString: {
            dateString: "$date",
            format: "%Y-%m-%d",
          },
        },
      },
    },

    // 4️⃣ Filter by date
    {
      $match: {
        dateObj: {
          $gte: new Date("2026-02-19"),
        },
      },
    },

    // 5️⃣ Group properly
    {
      $group: {
        _id: "$paymentsArray.type",
        totalAmount: { $sum: "$paymentsArray.amount" },
      },
    },
  ]);

  console.log(result);

  await mongoose.disconnect();
  console.log("✅ Disconnected");
}

main().catch(console.error);
