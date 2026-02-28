import { connectToDB } from "@/lib/mongodb";
import Game from "@/models/game";

const PS5_CONSOLE = {
  consoleId: "ps5",
  name: "PlayStation 5",
  type: "PlayStation",
};

const PS_URLS = [
  "https://www.playstation.com/bin/imagic/gameslist?locale=en-in&categoryList=plus-monthly-games-list",
  "https://www.playstation.com/bin/imagic/gameslist?locale=en-in&categoryList=plus-games-list",
  "https://www.playstation.com/bin/imagic/gameslist?locale=en-in&categoryList=ubisoft-classics-list",
  "https://www.playstation.com/bin/imagic/gameslist?locale=en-in&categoryList=plus-classics-list",
];

// Normalize title: lowercase, remove punctuation, remove known suffixes like PS4/PS5, collapse spaces
function normalize(title: string): string {
  return title
    .replace(/ps4\s*&?\s*ps5|ps5|ps4/gi, "") // remove PS4/PS5 suffix
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "") // remove special chars
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim();
}

async function fetchPlayStationGames(): Promise<
  {
    title: string;
    imageUrl: string;
    genre?: string;
  }[]
> {
  const allGames: {
    title: string;
    imageUrl: string;
    genre: string;
  }[] = [];

  for (const url of PS_URLS) {
    const res = await fetch(url);
    const data = await res.json();

    for (const letterGroup of data) {
      for (const game of letterGroup.games ?? []) {
        const title = game.name?.trim();
        const imageUrl = game.imageUrl?.startsWith("http")
          ? game.imageUrl
          : `https://image.api.playstation.com${game.imageUrl}`;

        const genre =
          Array.isArray(game?.genre) && game?.genre.length > 0
            ? (game.genre[0] as string)
            : "";

        if (!title || !imageUrl) continue;

        allGames.push({ title, imageUrl, genre });
      }
    }
  }

  return allGames;
}

async function syncPlayStationGames() {
  await connectToDB();

  const existingGames = await Game.find().lean();

  const gameMap = new Map(existingGames.map((g) => [normalize(g.title), g]));

  const psGames = await fetchPlayStationGames();

  let inserted = 0,
    updated = 0;

  for (const game of psGames) {
    const normTitle = normalize(game.title);
    const existing = gameMap.get(normTitle);

    const updatePayload: any = {
      title: game.title,
      imageUrl: game.imageUrl,
      genre: game.genre,
      installed: false,
    };

    if (existing) {
      // Only add PS5 to playableOn if not already there
      const hasPS5 = existing.playableOn?.some(
        (c: any) => c.consoleId === "ps5",
      );

      if (!hasPS5) {
        updatePayload.playableOn = [
          ...(existing.playableOn || []),
          PS5_CONSOLE,
        ];
      }

      const hasInstalled = existing.installedOn?.some(
        (c: any) => c.consoleId === "ps5",
      );
      if (!hasInstalled) {
        updatePayload.installedOn = [...(existing?.installedOn || [])];
      }

      const updatedInstalledOn =
        updatePayload?.installedOn || existing?.installedOn || [];
      updatePayload.installed = updatedInstalledOn.length > 0;

      await Game.updateOne({ _id: existing._id }, { $set: updatePayload });
      updated++;
    } else {
      // Insert new game
      updatePayload.playableOn = [PS5_CONSOLE];
      updatePayload.installedOn = [];
      updatePayload.installed = false;

      await Game.create(updatePayload);
      inserted++;
    }
  }

  console.log(
    `✅ Inserted ${inserted} new PS games, Updated ${updated} existing.`,
  );
  process.exit(0);
}

syncPlayStationGames().catch((err) => {
  console.error("❌ Error seeding PlayStation games:", err);
  process.exit(1);
});
