"use client";

import { useSession } from "next-auth/react";
import { Container, Stack, Alert } from "@mui/material";
import AdminLoginCard from "@/components/AdminLoginCard";
import AdminDashboard from "@/components/AdminDashboard";

export default function AdminPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="info">Loading…</Alert>
      </Container>
    );
  }

  if (!session?.user?.email) {
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

  return <AdminDashboard />;
}
