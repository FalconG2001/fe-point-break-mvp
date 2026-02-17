import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/availability-actions";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date") || "";
  const duration = Number(url.searchParams.get("duration") || "60") || 60;

  try {
    const data = await getAvailability({ date, duration });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to load availability" },
      { status: 400 },
    );
  }
}
