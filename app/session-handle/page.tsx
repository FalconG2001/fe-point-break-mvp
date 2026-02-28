import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import SessionHandlerClient from "./SessionHandlerClient";

const errorMessages = {
  AccessDenied: {
    title: "Access Denied",
    message: "You are not authorized to access the admin area.",
  },
  defaultError: {
    title: "Something Went Wrong",
    message: "An error occurred in your session",
  },
};

export default async function SessionHandle({
  searchParams,
}: PageProps<"/session-handle">) {
  const sp = (await searchParams) as { error?: string };
  const err = (sp.error || "defaultError") as keyof typeof errorMessages;

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 3,
        }}
      >
        <SessionHandlerClient />
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight="600" gutterBottom>
            {errorMessages[err]?.title}
          </Typography>
          <Typography color="text.secondary">
            {errorMessages[err]?.message}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Signing you out...
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
