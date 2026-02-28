import { getServerSession } from "next-auth";

import AllBookings from "@/components/AllBookings";

import { getAdminBookings } from "@/lib/admin-actions";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function BookingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const initialData = await getAdminBookings({
    page: 1,
    limit: 10,
  });

  return <AllBookings initialData={initialData} />;
}
