import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminAllowed, getDb } from "@/lib/mongodb";
import { isDateAllowed } from "@/lib/config";

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
    selections: b.selections ?? [],
    customer: b.customer ?? { name: "", phone: "" },
    createdAt: b.createdAt,
  }));

  const totalBookings = mapped.length;
  const totalConsolesBooked = mapped.reduce(
    (sum, b) => sum + (b.selections?.length ?? 0),
    0,
  );
  const totalPlayers = mapped.reduce(
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
