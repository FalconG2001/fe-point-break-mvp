import { getServerSession } from "next-auth";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";

import { AdminProvider } from "@/components/AdminContext";
import AdminHeader from "@/components/AdminHeader";
import { authOptions } from "@/lib/auth";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  return (
    <AdminProvider session={session}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 8 } }}>
        <Stack spacing={4}>
          {email && email?.length > 0 && <AdminHeader />}
          {children}
        </Stack>
      </Container>
    </AdminProvider>
  );
};

export default AdminLayout;
