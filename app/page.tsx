import BookingFlow from "@/components/BookingFlow";
import { todayYmd } from "@/lib/config";
import { getAvailability } from "@/lib/availability-actions";
import { getInstalledGames } from "@/lib/admin-actions";
import pricing from "@/models/pricing";
import { connectToDB } from "@/lib/mongodb";

// Never cache this page – slot availability depends on the current IST time
export const dynamic = "force-dynamic";

export default async function Page() {
  await connectToDB();

  const initialData = await getAvailability({
    date: todayYmd(0),
    duration: 60,
  }).catch(() => undefined);

  const games = await getInstalledGames().catch(() => []);
  const pricings = await pricing
    .find({})
    .select({ _id: 0, __v: 0 })
    .lean()
    .catch(() => []);

  return (
    <BookingFlow initialData={initialData} games={games} pricing={pricings} />
  );
}
