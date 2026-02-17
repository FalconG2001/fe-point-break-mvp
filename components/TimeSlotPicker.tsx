"use client";

import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import type { AvailabilitySlot } from "@/types";

type Props = {
  slots: AvailabilitySlot[];
  value: string | null;
  onChange: (slot: string) => void;
};

export default function TimeSlotPicker({ slots, value, onChange }: Props) {
  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={800} sx={{ mt: 1 }}>
        Available Slots
      </Typography>
      <Grid container spacing={1.5}>
        {slots.map((s) => {
          const disabled = s.availableConsoleIds.length === 0 || s.isPast;
          const selected = value === s.slot;

          let statusColor = "success";
          if (disabled) statusColor = "error";
          else if (s.tvCapacityRemaining <= 2) statusColor = "warning";

          return (
            <Grid key={s.slot} size={{ xs: 6, sm: 4, md: 3 }}>
              <Button
                fullWidth
                variant={selected ? "contained" : "outlined"}
                onClick={() => onChange(s.slot)}
                disabled={disabled}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderRadius: 1,
                  borderWidth: 1,
                  borderColor: selected ? "#000" : "rgba(0, 0, 0, 0.1)",
                  background: selected ? "#000" : "rgba(0, 0, 0, 0.02)",
                  color: selected ? "#fff" : "text.primary",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                  "&:hover": {
                    background: selected ? "#222" : "rgba(0, 0, 0, 0.05)",
                    borderColor: "#000",
                  },
                  "&.Mui-disabled": {
                    opacity: 0.3,
                    border: "1px solid rgba(0, 0, 0, 0.05)",
                  },
                }}
              >
                <Typography variant="subtitle2" fontWeight={800}>
                  {s.slot}
                </Typography>
                <Chip
                  size="small"
                  label={
                    s.isPast
                      ? "Passed"
                      : disabled
                        ? "Full"
                        : `${s.tvCapacityRemaining} TV left`
                  }
                  variant={selected ? "filled" : "outlined"}
                  sx={{
                    height: 18,
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    borderRadius: 0.5,
                    backgroundColor: selected
                      ? "rgba(255,255,255,0.1)"
                      : "transparent",
                    color: selected ? "inherit" : "text.secondary",
                    border: selected ? "none" : "1px solid rgba(0,0,0,0.05)",
                  }}
                />
              </Button>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}
