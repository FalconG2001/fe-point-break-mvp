"use client";

import * as React from "react";
import { Tabs, Tab, Paper } from "@mui/material";
import { todayYmd } from "@/lib/config";

type Props = {
  value: string;
  onChange: (date: string) => void;
};

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
        <Tab label="Today" />
        <Tab label="Tomorrow" />
        <Tab label="Day after" />
      </Tabs>
    </Paper>
  );
}
