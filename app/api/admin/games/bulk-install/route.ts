import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Game from "@/models/game";
import Console from "@/models/console";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(req: Request) {
  try {
    await connectToDB();
    const body = await req.json();

    const consoleId = String(body.consoleId || "");
    const identifiers: string[] = Array.isArray(body.identifiers)
      ? body.identifiers
      : [];

    if (!consoleId)
      return NextResponse.json(
        { error: "consoleId required" },
        { status: 400 },
      );
    if (identifiers.length === 0)
      return NextResponse.json(
        { error: "identifiers required" },
        { status: 400 },
      );

    const consoleDoc = await Console.findOne({ consoleId }).lean();
    if (!consoleDoc) {
      return NextResponse.json({ error: "Console not found" }, { status: 404 });
    }

    const consoleRef = {
      consoleId: consoleDoc.consoleId,
      name: consoleDoc.name,
      type: consoleDoc.type,
    };

    const ids: string[] = [];
    const titles: string[] = [];

    for (const x of identifiers) {
      const v = String(x).trim();
      if (/^[a-fA-F0-9]{24}$/.test(v)) ids.push(v);
      else titles.push(v);
    }

    const missing: string[] = [];

    // by ids
    let updatedCount = 0;
    if (ids.length) {
      const r = await Game.updateMany(
        { _id: { $in: ids } },
        { $addToSet: { installedOn: consoleRef }, $set: { installed: true } },
      );
      updatedCount += r.modifiedCount ?? 0;
    }

    // by titles (exact, case-insensitive)
    for (const t of titles) {
      const doc = await Game.findOne({
        title: { $regex: new RegExp(`^${escapeRegExp(t)}$`, "i") },
      }).select({ _id: 1 });

      if (!doc) {
        missing.push(t);
        continue;
      }

      const r = await Game.updateOne(
        { _id: doc._id },
        { $addToSet: { installedOn: consoleRef }, $set: { installed: true } },
      );
      updatedCount += r.modifiedCount ?? 0;
    }

    return NextResponse.json({ ok: true, updated: updatedCount, missing });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Bulk install failed" },
      { status: 400 },
    );
  }
}
