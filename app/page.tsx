import BookingFlow from "@/components/BookingFlow";
import { todayYmd } from "@/lib/config";
import { getAvailability } from "@/lib/availability-actions";

export default async function Page() {
  const initialData = await getAvailability({
    date: todayYmd(0),
    duration: 60,
  }).catch(() => undefined);

  return <BookingFlow initialData={initialData} />;
}
