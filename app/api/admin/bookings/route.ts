import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminAllowed, getDb } from "@/lib/mongodb";
import {
  isDateAllowed,
  DURATION_LABELS,
  type DurationMinutes,
} from "@/lib/config";
import { ObjectId } from "mongodb";

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
  const date = url.searchParams.get("date") || "";
  if (!isDateAllowed(date)) {
    return NextResponse.json({ error: "Date not allowed" }, { status: 400 });
  }

  const db = await getDb();
  const bookings = await db
    .collection("bookings")
    .find({ date })
    .sort({ slot: 1, createdAt: 1 })
    .toArray();

  const mapped = bookings.map((b) => ({
    id: String(b._id),
    date: b.date,
    slot: b.slot,
    selections: (b.selections ?? []).map((s: any) => ({
      consoleId: s.consoleId,
      players: s.players,
      duration: s.duration || 60,
      durationLabel:
        DURATION_LABELS[(s.duration || 60) as DurationMinutes] ||
        `${s.duration || 60} min`,
    })),
    customer: b.customer ?? { name: "", phone: "" },
    confirmed: b.confirmed !== false, // Default to true for legacy bookings
    createdAt: b.createdAt,
  }));

  const confirmedBookings = mapped.filter((b) => b.confirmed);
  const totalBookings = confirmedBookings.length;
  const totalConsolesBooked = confirmedBookings.reduce(
    (sum, b) => sum + (b.selections?.length ?? 0),
    0,
  );
  const totalPlayers = confirmedBookings.reduce(
    (sum, b) =>
      sum +
      (b.selections?.reduce((s: number, x: any) => s + (x.players ?? 0), 0) ??
        0),
    0,
  );

  return NextResponse.json({
    date,
    totalBookings,
    totalConsolesBooked,
    totalPlayers,
    bookings: mapped,
  });
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

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(bookingId);
  } catch {
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
  }

  const db = await getDb();
  const result = await db
    .collection("bookings")
    .updateOne({ _id: objectId }, { $set: { confirmed } });

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
