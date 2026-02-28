import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Game from "@/models/game";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isAdminAllowed } from "@/lib/admin-actions";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await isAdminAllowed(session.user.email);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, imageUrl, genre, shortDesc, installedConsoleIds } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    await connectToDB();

    const newGame = await Game.create({
      title,
      imageUrl,
      genre,
      shortDesc,
      installedConsoleIds: installedConsoleIds || [],
    });

    return NextResponse.json(newGame, { status: 201 });
  } catch (error: any) {
    console.error("Game creation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create game" },
      { status: 500 },
    );
  }
}
