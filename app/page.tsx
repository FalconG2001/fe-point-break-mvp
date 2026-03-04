import BookingFlow from "@/components/BookingFlow";
import PricingNotes from "@/components/PricingNotes";
import Link from "next/link";
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
    <div className="flex flex-col gap-12 pb-12">
      <BookingFlow initialData={initialData} games={games} pricing={pricings} />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-lg transition-colors group"
        >
          View Detailed Pricing Plans
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:translate-x-1 transition-transform"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <PricingNotes />
      </section>
    </div>
  );
}
