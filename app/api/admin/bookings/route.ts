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
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const searchName = url.searchParams.get("searchName");
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);

  const query: any = {};

  if (date) {
    if (!startDate && !endDate && !isDateAllowed(date)) {
      return NextResponse.json({ error: "Date not allowed" }, { status: 400 });
    }
    query.date = date;
  } else if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  }

  if (searchName) {
    query["customer.name"] = { $regex: searchName, $options: "i" };
  }

  const db = await getDb();
  const totalCount = await db.collection("bookings").countDocuments(query);
  const skip = (page - 1) * limit;

  const bookings = await db
    .collection("bookings")
    .find(query)
    .sort({ date: -1, slot: 1, createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const mapped = bookings.map((b) => {
    const startMins = (() => {
      const [h, m] = b.slot.split(":").map(Number);
      return h * 60 + m;
    })();

    const selections = (b.selections ?? []).map((s: any) => {
      const duration = s.duration || 60;
      const endMins = startMins + duration;
      const eh = Math.floor(endMins / 60);
      const em = endMins % 60;
      const endTime = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;

      return {
        consoleId: s.consoleId,
        players: s.players,
        duration,
        endTime,
        durationLabel:
          DURATION_LABELS[duration as DurationMinutes] || `${duration} min`,
      };
    });

    return {
      id: String(b._id),
      date: b.date,
      slot: b.slot,
      selections,
      customer: b.customer ?? { name: "", phone: "" },
      confirmed: b.confirmed !== false,
      payments: b.payments || [],
      totalPrice: b.totalPrice || 0,
      createdAt: b.createdAt,
      bookingFrom: b.bookingFrom,
    };
  });

  // Calculate stats should ideally ONLY happen for the single date view (first table)
  // or be based on the filtered set. The prompt doesn't specify stats for the range table.
  // We'll keep them but they might be less relevant for a large range.
  const confirmedBookings = mapped.filter((b) => b.confirmed);
  const totalBookingsCount = confirmedBookings.length;
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

  const grandTotalPaid = confirmedBookings.reduce((sum, b) => {
    const paid = b.payments.reduce(
      (s: number, p: any) => s + (p.amount || 0),
      0,
    );
    return sum + paid;
  }, 0);

  const grandTotalDue = confirmedBookings.reduce((sum, b) => {
    const paid = b.payments.reduce(
      (s: number, p: any) => s + (p.amount || 0),
      0,
    );
    const due = Math.max(0, (b.totalPrice || 0) - paid);
    return sum + due;
  }, 0);

  let lastSlotEnding = "";
  if (confirmedBookings.length > 0) {
    let maxMins = 0;
    for (const b of confirmedBookings) {
      for (const s of b.selections) {
        if (!s.endTime) continue;
        const [h, m] = s.endTime.split(":").map(Number);
        const mins = h * 60 + m;
        if (mins > maxMins) maxMins = mins;
      }
    }
    const lh = Math.floor(maxMins / 60);
    const lm = maxMins % 60;
    lastSlotEnding = `${String(lh).padStart(2, "0")}:${String(lm).padStart(2, "0")}`;
  }

  return NextResponse.json({
    date,
    totalBookings: totalBookingsCount,
    totalConsolesBooked,
    totalPlayers,
    grandTotalPaid,
    grandTotalDue,
    lastSlotEnding,
    bookings: mapped,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
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
