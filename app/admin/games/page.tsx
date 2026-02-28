import AdminGamesClient from "@/components/admin/games/AdminGamesClient";
import { connectToDB } from "@/lib/mongodb";
import Game from "@/models/game";
import Console from "@/models/console";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

export default async function Page({
  searchParams,
}: PageProps<"/admin/games">) {
  const sp = (await searchParams) as { page?: string; keyword?: string };
  const page = Math.max(1, Number(sp?.page ?? 1) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  await connectToDB();

  const [total, consoles, items] = await Promise.all([
    Game.countDocuments(),
    Console.find({}).sort({ type: 1, name: 1 }).lean(),
    Game.find({
      ...(sp?.keyword && sp.keyword !== ""
        ? { title: { $regex: sp.keyword, $options: "i" } }
        : {}),
    })
      .sort({ installed: -1, title: 1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .select(
        "_id title genre imageUrl shortDesc playableOn installedOn installed",
      )
      .lean(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // make ids safe for client
  const dtoItems = items.map((g) => {
    const { _id, ...rest } = g;
    return { ...rest, id: _id?.toString() };
  });

  const dtoConsoles = consoles.map((c) => ({
    consoleId: c.consoleId,
    name: c.name,
    type: c.type,
    imgSrc: c.imgSrc ?? "",
  }));

  return (
    <AdminGamesClient
      initialData={{
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages,
        items: dtoItems,
        consoles: dtoConsoles,
      }}
    />
  );
}
