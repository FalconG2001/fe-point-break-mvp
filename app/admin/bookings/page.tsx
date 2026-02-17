import AllBookings from "@/components/AllBookings";
import { getAdminBookings } from "@/lib/admin-actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminAllowed } from "@/lib/mongodb";

export default async function BookingsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    redirect("/admin");
  }

  const allowed = await isAdminAllowed(email);
  if (!allowed) {
    redirect("/");
  }

  const initialData = await getAdminBookings({
    page: 1,
    limit: 10,
  });

  return <AllBookings initialData={initialData} />;
}
