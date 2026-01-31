"use client";

import * as React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { SessionProvider } from "next-auth/react";
import theme from "@/theme";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
