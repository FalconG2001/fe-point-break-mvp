"use client";

import * as React from "react";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";

import type { AvailabilitySlot } from "@/types";

type Props = {
  slots: AvailabilitySlot[];
  value: string | null;
  onChange: (slot: string) => void;

  // Default: false (clean UI)
  showFull?: boolean;

  // Default: false (past slots are just noise)
  showPast?: boolean;
};

export default function TimeSlotPicker({
  slots,
  value,
  onChange,
  showFull = false,
  showPast = false,
}: Props) {
  const [showMore, setShowMore] = React.useState(false);

  const filteredSlots = React.useMemo(() => {
    let s = [...slots];

    if (!showPast) s = s.filter((x) => !x.isPast);
    if (!showFull) s = s.filter((x) => x.availableConsoleIds.length > 0);

    // Put “best” options first
    return s;
  }, [slots, showFull, showPast]);

  const visibleSlots = React.useMemo(() => {
    if (showMore) return filteredSlots;
    return filteredSlots.slice(0, 12);
  }, [filteredSlots, showMore]);

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle1" fontWeight={900}>
          Slots
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tap a slot. We jump to consoles.
        </Typography>
      </Stack>

      {filteredSlots.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No slots to show.
        </Typography>
      ) : (
        <Grid container spacing={1.5}>
          {visibleSlots.map((s) => {
            const disabled = s.availableConsoleIds.length === 0 || s.isPast;
            const selected = value === s.slot;

            let label = `${s.tvCapacityRemaining} TV left`;
            if (s.isPast) label = "Passed";
            else if (s.availableConsoleIds.length === 0) label = "Full";
            else if (s.tvCapacityRemaining <= 2)
              label = `Hurry • ${s.tvCapacityRemaining} left`;

            return (
              <Grid key={s.slot} size={{ xs: 6, sm: 4, md: 3 }}>
                <Button
                  fullWidth
                  variant={selected ? "contained" : "outlined"}
                  onClick={() => onChange(s.slot)}
                  disabled={disabled}
                  sx={{
                    py: 1.4,
                    borderRadius: 2,
                    borderColor: selected ? "#000" : "rgba(0,0,0,0.12)",
                    background: selected ? "#000" : "#fff",
                    color: selected ? "#fff" : "text.primary",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.6,
                    "&:hover": {
                      background: selected ? "#222" : "rgba(0,0,0,0.03)",
                      borderColor: "#000",
                    },
                    "&.Mui-disabled": { opacity: 0.28 },
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={900}>
                    {s.slot}
                  </Typography>
                  <Chip
                    size="small"
                    label={label}
                    variant={selected ? "filled" : "outlined"}
                    sx={{
                      height: 20,
                      fontSize: "0.62rem",
                      fontWeight: 900,
                      borderRadius: 1,
                      backgroundColor: selected
                        ? "rgba(255,255,255,0.12)"
                        : "transparent",
                      color: selected ? "inherit" : "text.secondary",
                      borderColor: selected
                        ? "transparent"
                        : "rgba(0,0,0,0.08)",
                    }}
                  />
                </Button>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Divider />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.secondary">
          Showing {visibleSlots.length} of {filteredSlots.length}
        </Typography>

        {filteredSlots.length > 12 && (
          <Button
            color="inherit"
            onClick={() => setShowMore((v) => !v)}
            sx={{ borderRadius: 2, fontWeight: 900 }}
          >
            {showMore ? "Show less" : "Show more"}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
