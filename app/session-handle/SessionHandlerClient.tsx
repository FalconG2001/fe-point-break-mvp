"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

import CircularProgress from "@mui/material/CircularProgress";

export default function SessionHandlerClient() {
  useEffect(() => {
    // Short delay to let the user see the message
    const timer = setTimeout(() => {
      signOut({ callbackUrl: "/login" });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  return <CircularProgress size={60} thickness={4} />;
}
