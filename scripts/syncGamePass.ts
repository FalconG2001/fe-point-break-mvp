import { connectToDB } from "@/lib/mongodb";
import Game from "@/models/game";

const SIGL_IDS = [
  "f6f1f99f-9b49-4ccd-b3bf-4d9767a77f5e",
  "b8900d09-a491-44cc-916e-32b5acae621b",
];
const MARKET = "IN";
const LANGUAGE = "en-in";

// Known console definitions
const XBOX_ONE_S = {
  consoleId: "xbox_one_s",
  name: "Xbox One S",
  type: "Xbox",
};
const XBOX_SERIES_X = {
  consoleId: "xbox_series_x",
  name: "Xbox Series X",
  type: "Xbox",
};

async function fetchGameIds(): Promise<string[]> {
  const allIds = new Set<string>();
  for (const siglId of SIGL_IDS) {
    const res = await fetch(
      `https://catalog.gamepass.com/sigls/v2?id=${siglId}&language=${LANGUAGE}&market=${MARKET}`,
    );
    const data = await res.json();
    for (const entry of data) {
      if (entry.id) allIds.add(entry.id);
    }
  }
  return Array.from(allIds);
}

function getPosterImage(images: any[]): string | undefined {
  if (!images?.length) return undefined;
  const poster = images.find((img) => img.ImagePurpose === "Poster");
  return "https:" + (poster?.Uri || images[0].Uri);
}

function getPlayableConsoles(gens: string[] = []): (typeof XBOX_ONE_S)[] {
  const consoles = [];
  if (gens.includes("ConsoleGen8")) consoles.push(XBOX_ONE_S);
  if (gens.includes("ConsoleGen9")) consoles.push(XBOX_SERIES_X);
  return consoles;
}

async function fetchAndSyncGameData(gameIds: string[]) {
  const BATCH_SIZE = 20;
  for (let i = 0; i < gameIds.length; i += BATCH_SIZE) {
    const batchIds = gameIds.slice(i, i + BATCH_SIZE).join(",");
    const res = await fetch(
      `https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=${batchIds}&market=${MARKET}&languages=${LANGUAGE}`,
    );
    const data = await res.json();

    for (const product of data.Products) {
      const localized = product.LocalizedProperties?.[0];
      const title = localized?.ProductTitle || "";
      const shortDesc = localized?.ShortDescription || "";
      const imageUrl = getPosterImage(localized?.Images);
      const gens = product.Properties?.XboxConsoleGenCompatible ?? [];
      const genre = product.Properties?.Category ?? "";

      if (!title) continue;

      const playableOn = getPlayableConsoles(gens);

      await Game.updateOne(
        { title },
        {
          $set: {
            title,
            shortDesc,
            imageUrl,
            playableOn,
            genre,
            installed: false,
          },
        },
        { upsert: true },
      );
    }
  }
}

async function main() {
  await connectToDB();
  // await Game.deleteMany();
  // console.log("Deleted All games in games collection");

  const ids = await fetchGameIds();
  console.log("🎮 Fetched", ids.length, "unique game IDs");

  await fetchAndSyncGameData(ids);
  console.log("✅ Games collection updated");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error syncing Game Pass games:", err);
  process.exit(1);
});
