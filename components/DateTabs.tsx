"use client";

import * as React from "react";
import { Tabs, Tab, Paper } from "@mui/material";
import { todayYmd } from "@/lib/config";

type Props = {
  value: string;
  onChange: (date: string) => void;
};

function formatDateLabel(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function DateTabs({ value, onChange }: Props) {
  const today = todayYmd(0);
  const d1 = todayYmd(1);
  const d2 = todayYmd(2);

  const dates = [today, d1, d2];
  const idx = dates.indexOf(value);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 1,
        p: 0.5,
        background: "rgba(0, 0, 0, 0.03)",
        border: "1px solid rgba(0, 0, 0, 0.05)",
      }}
    >
      <Tabs
        value={idx >= 0 ? idx : 0}
        onChange={(_, newIdx: number) => onChange(dates[newIdx])}
        variant="fullWidth"
        sx={{
          minHeight: 40,
          "& .MuiTabs-indicator": {
            height: "100%",
            borderRadius: 0.75,
            backgroundColor: "text.primary",
            zIndex: 0,
          },
          "& .MuiTab-root": {
            zIndex: 1,
            minHeight: 40,
            borderRadius: 0.75,
            color: "text.secondary",
            fontWeight: 700,
            textTransform: "none",
            fontSize: "0.85rem",
            "&.Mui-selected": {
              color: "#ffffff",
            },
          },
        }}
      >
        <Tab label={formatDateLabel(today)} disableRipple />
        <Tab label={formatDateLabel(d1)} disableRipple />
        <Tab label={formatDateLabel(d2)} disableRipple />
      </Tabs>
    </Paper>
  );
}
