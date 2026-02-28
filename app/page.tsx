import BookingFlow from "@/components/BookingFlow";
import { todayYmd } from "@/lib/config";
import { getAvailability } from "@/lib/availability-actions";
import { getInstalledGames } from "@/lib/admin-actions";

// Never cache this page – slot availability depends on the current IST time
export const dynamic = "force-dynamic";

export default async function Page() {
  const initialData = await getAvailability({
    date: todayYmd(0),
    duration: 60,
  }).catch(() => undefined);

  const games = await getInstalledGames().catch(() => []);

  return <BookingFlow initialData={initialData} games={games} />;
}
