import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import AdminDashboard from "@/components/AdminDashboard";

import { authOptions } from "@/lib/auth";
import { todayYmd } from "@/lib/config";
import { getAdminBookings } from "@/lib/admin-actions";
import pricing from "@/models/pricing";
import { connectToDB } from "@/lib/mongodb";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return redirect("/login");
  }

  await connectToDB();

  const initialData = await getAdminBookings({
    date: todayYmd(0),
  });

  const pricings = await pricing
    .find({})
    .select({ _id: 0, __v: 0 })
    .lean()
    .catch(() => []);

  return <AdminDashboard initialData={initialData} pricing={pricings} />;
}
