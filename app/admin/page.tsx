import { getServerSession } from "next-auth";

import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";

import AdminDashboard from "@/components/AdminDashboard";
import AdminLoginCard from "@/components/AdminLoginCard";

import { authOptions } from "@/lib/auth";
import { isAdminAllowed } from "@/lib/mongodb";
import { todayYmd } from "@/lib/config";
import { getAdminBookings } from "@/lib/admin-actions";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Stack spacing={2}>
          <AdminLoginCard />
          <Alert severity="info">
            If your email is not in the allowlist, Google login will fail.
          </Alert>
        </Stack>
      </Container>
    );
  }

  const allowed = await isAdminAllowed(email);
  if (!allowed) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">Not allowed</Alert>
      </Container>
    );
  }

  const initialData = await getAdminBookings({
    date: todayYmd(0),
  });

  return <AdminDashboard initialData={initialData} />;
}
