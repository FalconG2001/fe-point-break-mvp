"use server";

import { connectToDB } from "@/lib/mongodb";
import Pricing from "@/models/pricing";

export async function getPricing(category: string = "session") {
  try {
    await connectToDB();
    const pricing = await Pricing.find({ category }).lean();
    return JSON.parse(JSON.stringify(pricing));
  } catch (error) {
    console.error("Error fetching pricing:", error);
    return [];
  }
}
