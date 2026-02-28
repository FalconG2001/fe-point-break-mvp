import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";

import AdminLoginCard from "@/components/AdminLoginCard";

import { authOptions } from "@/lib/auth";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = (await searchParams) as { callbackUrl?: string };
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    return redirect(sp.callbackUrl || "/admin");
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <AdminLoginCard callbackUrl={sp.callbackUrl} />
        <Alert severity="info">
          If your email is not in the allowlist, Google login will fail.
        </Alert>
      </Stack>
    </Container>
  );
}
