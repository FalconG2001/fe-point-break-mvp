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

  const idx = value === today ? 0 : value === d1 ? 1 : 2;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Tabs
        value={idx}
        onChange={(_, newIdx: number) => onChange([today, d1, d2][newIdx])}
        variant="fullWidth"
      >
        <Tab label={formatDateLabel(today)} />
        <Tab label={formatDateLabel(d1)} />
        <Tab label={formatDateLabel(d2)} />
      </Tabs>
    </Paper>
  );
}
