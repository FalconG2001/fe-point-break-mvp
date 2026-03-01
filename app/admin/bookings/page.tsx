import { getServerSession } from "next-auth";

import AllBookings from "@/components/AllBookings";

import { getAdminBookings } from "@/lib/admin-actions";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectToDB } from "@/lib/mongodb";
import pricing from "@/models/pricing";

export default async function BookingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  await connectToDB();

  const initialData = await getAdminBookings({
    page: 1,
    limit: 10,
  });

  const pricings = await pricing
    .find({})
    .select({ _id: 0, __v: 0 })
    .lean()
    .catch(() => []);

  return <AllBookings initialData={initialData} pricing={pricings} />;
}
