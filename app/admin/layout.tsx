import { Container, Stack } from "@mui/material";
import { AdminProvider } from "@/components/AdminContext";
import AdminHeader from "@/components/AdminHeader";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AdminProvider>
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 8 } }}>
        <Stack spacing={4}>
          <AdminHeader />
          {children}
        </Stack>
      </Container>
    </AdminProvider>
  );
};

export default AdminLayout;
