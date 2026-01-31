"use client";

import { signIn } from "next-auth/react";
import { Card, CardContent, Typography, Button, Stack } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

export default function AdminLoginCard() {
  return (
    <Card variant="outlined" sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack spacing={2} alignItems="flex-start">
          <Typography variant="h6" fontWeight={800}>
            Admin login
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Only allowed Gmail accounts can enter.
          </Typography>
          <Button
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={() => signIn("google")}
            sx={{ borderRadius: 3 }}
          >
            Sign in with Google
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
