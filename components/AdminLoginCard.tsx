"use client";

import { signIn } from "next-auth/react";
import { Card, CardContent, Typography, Button, Stack } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

export default function AdminLoginCard() {
  return (
    <Card
      className="glass-panel"
      elevation={0}
      sx={{
        borderRadius: 1,
        background: "#ffffff",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        p: 2,
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
      }}
    >
      <CardContent>
        <Stack spacing={3} alignItems="center" sx={{ textAlign: "center" }}>
          <Stack spacing={1}>
            <Typography variant="h5" fontWeight={900}>
              Admin
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Authorized personnel only.
            </Typography>
          </Stack>
          <Button
            variant="contained"
            fullWidth
            startIcon={<GoogleIcon />}
            onClick={() => signIn("google")}
            sx={{
              borderRadius: 0.5,
              py: 1.2,
              background: "#000",
              color: "#fff",
              "&:hover": { background: "#222" },
            }}
          >
            Sign in
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
