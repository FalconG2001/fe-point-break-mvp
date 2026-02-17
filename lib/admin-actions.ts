import { getDb } from "@/lib/mongodb";
import {
  isDateAllowed,
  DURATION_LABELS,
  type DurationMinutes,
} from "@/lib/config";
import { ApiResp } from "@/lib/types";

export interface GetAdminBookingsParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  searchName?: string;
  page?: number;
  limit?: number;
}

export async function getAdminBookings(
  params: GetAdminBookingsParams,
): Promise<ApiResp> {
  const {
    date = "",
    startDate,
    endDate,
    searchName,
    page = 1,
    limit = 10,
  } = params;

  const query: any = {};

  if (date) {
    if (!startDate && !endDate && !isDateAllowed(date)) {
      throw new Error("Date not allowed");
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

  return {
    date: date || (startDate && endDate ? `${startDate} to ${endDate}` : ""),
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
  };
}
