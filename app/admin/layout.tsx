"use client";

import { Button, Container, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { signOut } from "next-auth/react";
import { AdminProvider, useAdmin } from "@/components/AdminContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

const AdminLayoutInner = ({ children }: { children: React.ReactNode }) => {
  const { setCreateBookingOpen } = useAdmin();
  const pathname = usePathname();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 8 } }}>
      <Stack spacing={4}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Stack spacing={0.5}>
            <Typography variant="h4" fontWeight={900} color="text.primary">
              Admin Terminal
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Managing session cycles.
              </Typography>
              <Stack direction="row" spacing={1}>
                <Link
                  href="/admin"
                  style={{
                    textDecoration: "none",
                    color: pathname === "/admin" ? "#000" : "#71717a",
                    fontSize: "0.85rem",
                    fontWeight: pathname === "/admin" ? 800 : 500,
                  }}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/bookings"
                  style={{
                    textDecoration: "none",
                    color: pathname === "/admin/bookings" ? "#000" : "#71717a",
                    fontSize: "0.85rem",
                    fontWeight: pathname === "/admin/bookings" ? 800 : 500,
                  }}
                >
                  Archive
                </Link>
              </Stack>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setCreateBookingOpen(true);
              }}
              sx={{
                borderRadius: 1,
                px: 3,
                background: "#000",
                color: "#fff",
                "&:hover": { background: "#222" },
              }}
            >
              New Booking
            </Button>
            <Button
              variant="outlined"
              onClick={() => signOut()}
              sx={{
                borderRadius: 1,
                color: "text.primary",
                borderColor: "rgba(0,0,0,0.2)",
              }}
            >
              Exit
            </Button>
          </Stack>
        </Stack>
        {children}
      </Stack>
    </Container>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AdminProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminProvider>
  );
};

export default AdminLayout;
