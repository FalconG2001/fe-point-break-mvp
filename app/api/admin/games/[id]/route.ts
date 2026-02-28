import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Game from "@/models/game";
import Console from "@/models/console";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectToDB();
    const body = await req.json();

    const update: any = {};
    if (body.title !== undefined) update.title = body.title;
    if (body.imageUrl !== undefined) update.imageUrl = body.imageUrl;
    if (body.genre !== undefined) update.genre = body.genre;
    if (body.shortDesc !== undefined) update.shortDesc = body.shortDesc;

    if (Array.isArray(body.installedConsoleIds)) {
      const found = await Console.find({
        consoleId: { $in: body.installedConsoleIds },
      }).lean();

      update.installedOn = found.map((c: any) => ({
        consoleId: c.consoleId,
        name: c.name,
        type: c.type,
      }));

      // keep your stored boolean consistent if you keep it
      update.installed = update.installedOn.length > 0;
    }

    const doc = await Game.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true },
    );

    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectToDB();
    const doc = await Game.findByIdAndDelete(id);
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Delete failed" },
      { status: 400 },
    );
  }
}
