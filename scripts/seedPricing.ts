import mongoose from "mongoose";
import Pricing from "@/models/pricing";

const uri = process.env.MONGODB_URI;

if (!uri) throw new Error("Missing MONGODB_URI");

type Row = {
  userType: "normal" | "college" | "school";
  category: "session" | "console_rent";
  durationMinutes: 30 | 60 | 90 | 120 | 150 | 180;
  minPlayers: number;
  maxPlayers: number;
  pricingType: "per_person" | "fixed_total";
  price: number;
};

function rowsForUser(userType: Row["userType"], prices: any): Row[] {
  const out: Row[] = [];

  // SESSION rows (per console)
  // 30 min = per person
  out.push(
    {
      userType,
      category: "session",
      durationMinutes: 30,
      minPlayers: 1,
      maxPlayers: 1,
      pricingType: "per_person",
      price: prices.session["30"].p1,
    },
    {
      userType,
      category: "session",
      durationMinutes: 30,
      minPlayers: 2,
      maxPlayers: 2,
      pricingType: "per_person",
      price: prices.session["30"].p2,
    },
    {
      userType,
      category: "session",
      durationMinutes: 30,
      minPlayers: 3,
      maxPlayers: 4,
      pricingType: "per_person",
      price: prices.session["30"].p34,
    },
    {
      userType,
      category: "session",
      durationMinutes: 30,
      minPlayers: 5,
      maxPlayers: 5,
      pricingType: "per_person",
      price: prices.session["30"].p5,
    },
  );

  // 60 min = per person
  out.push(
    {
      userType,
      category: "session",
      durationMinutes: 60,
      minPlayers: 1,
      maxPlayers: 1,
      pricingType: "per_person",
      price: prices.session["60"].p1,
    },
    {
      userType,
      category: "session",
      durationMinutes: 60,
      minPlayers: 2,
      maxPlayers: 2,
      pricingType: "per_person",
      price: prices.session["60"].p2,
    },
    {
      userType,
      category: "session",
      durationMinutes: 60,
      minPlayers: 3,
      maxPlayers: 4,
      pricingType: "per_person",
      price: prices.session["60"].p34,
    },
    {
      userType,
      category: "session",
      durationMinutes: 60,
      minPlayers: 5,
      maxPlayers: 5,
      pricingType: "per_person",
      price: prices.session["60"].p5,
    },
  );

  // 90/120/150/180 fixed total
  const fixedDurations: Array<90 | 120 | 150 | 180> = [90, 120, 150, 180];
  for (const d of fixedDurations) {
    out.push(
      {
        userType,
        category: "session",
        durationMinutes: d,
        minPlayers: 1,
        maxPlayers: 1,
        pricingType: "fixed_total",
        price: prices.session[String(d)].p1,
      },
      {
        userType,
        category: "session",
        durationMinutes: d,
        minPlayers: 2,
        maxPlayers: 2,
        pricingType: "fixed_total",
        price: prices.session[String(d)].p2,
      },
      {
        userType,
        category: "session",
        durationMinutes: d,
        minPlayers: 3,
        maxPlayers: 4,
        pricingType: "fixed_total",
        price: prices.session[String(d)].p34,
      },
      {
        userType,
        category: "session",
        durationMinutes: d,
        minPlayers: 5,
        maxPlayers: 5,
        pricingType: "fixed_total",
        price: prices.session[String(d)].p5,
      },
    );
  }

  // CONSOLE RENT (fixed total) - only 60/90/120/150/180 (no 30)
  const rentDurations: Array<60 | 90 | 120 | 150 | 180> = [
    60, 90, 120, 150, 180,
  ];
  for (const d of rentDurations) {
    out.push({
      userType,
      category: "console_rent",
      durationMinutes: d,
      minPlayers: 0,
      maxPlayers: 0,
      pricingType: "fixed_total",
      price: prices.rent[String(d)],
    });
  }

  return out;
}

async function main() {
  await mongoose.connect(uri!);
  console.log("✅ Connected");

  // Student prices (college/school)
  const student = {
    session: {
      "30": { p1: 60, p2: 50, p34: 50, p5: 50 },
      "60": { p1: 90, p2: 80, p34: 70, p5: 70 },

      // fixed totals
      "90": { p1: 130, p2: 220, p34: 320, p5: 380 },
      "120": { p1: 160, p2: 280, p34: 350, p5: 440 },
      "150": { p1: 190, p2: 350, p34: 430, p5: 520 },
      "180": { p1: 220, p2: 420, p34: 510, p5: 600 },
    },
    rent: {
      "60": 270,
      "90": 390,
      "120": 500,
      "150": 600,
      "180": 690,
    },
  };

  // Normal prices
  const normal = {
    session: {
      "30": { p1: 60, p2: 50, p34: 50, p5: 50 },
      "60": { p1: 100, p2: 85, p34: 75, p5: 75 },

      // fixed totals
      "90": { p1: 140, p2: 250, p34: 370, p5: 430 },
      "120": { p1: 180, p2: 320, p34: 410, p5: 500 },
      "150": { p1: 220, p2: 400, p34: 490, p5: 590 },
      "180": { p1: 250, p2: 480, p34: 570, p5: 680 },
    },
    rent: {
      "60": 350,
      "90": 480,
      "120": 600,
      "150": 680,
      "180": 750,
    },
  };

  const rows: Row[] = [
    ...rowsForUser("normal", normal),
    ...rowsForUser("college", student),
    ...rowsForUser("school", student),
  ];

  // wipe + insert
  await Pricing.deleteMany({});
  await Pricing.insertMany(rows);

  console.log(`✅ Seeded ${rows.length} pricing rows`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
