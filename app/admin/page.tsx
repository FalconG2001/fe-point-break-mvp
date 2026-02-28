import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import AdminDashboard from "@/components/AdminDashboard";

import { authOptions } from "@/lib/auth";
import { todayYmd } from "@/lib/config";
import { getAdminBookings } from "@/lib/admin-actions";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return redirect("/login");
  }

  const initialData = await getAdminBookings({
    date: todayYmd(0),
  });

  return <AdminDashboard initialData={initialData} />;
}
