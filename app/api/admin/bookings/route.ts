import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/lib/mongodb";
import Booking from "@/models/booking";
import mongoose from "mongoose";
import { getAdminBookings, isAdminAllowed } from "@/lib/admin-actions";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const allowed = await isAdminAllowed(email);
  if (!allowed) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const url = new URL(req.url);
  const params = {
    date: url.searchParams.get("date") || "",
    startDate: url.searchParams.get("startDate") || undefined,
    endDate: url.searchParams.get("endDate") || undefined,
    searchName: url.searchParams.get("searchName") || undefined,
    page: parseInt(url.searchParams.get("page") || "1", 10),
    limit: parseInt(url.searchParams.get("limit") || "10", 10),
  };

  try {
    const data = await getAdminBookings(params);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 });
  }
}

// PATCH: Cancel or restore a booking
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const allowed = await isAdminAllowed(email);
  if (!allowed) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const bookingId = body?.bookingId;
  const confirmed = body?.confirmed;

  if (!bookingId || typeof confirmed !== "boolean") {
    return NextResponse.json(
      { error: "bookingId and confirmed (boolean) are required" },
      { status: 400 },
    );
  }

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
  }
  const objectId = new mongoose.Types.ObjectId(bookingId);

  await connectToDB();
  const result = await Booking.updateOne(
    { _id: objectId },
    { $set: { confirmed } },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    bookingId,
    confirmed,
    message: confirmed ? "Booking restored" : "Booking cancelled",
  });
}
