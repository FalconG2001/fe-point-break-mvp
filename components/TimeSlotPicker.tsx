"use client";

import { Grid, Button, Typography, Stack, Chip } from "@mui/material";
import type { AvailabilitySlot } from "@/types";

type Props = {
  slots: AvailabilitySlot[];
  value: string | null;
  onChange: (slot: string) => void;
};

export default function TimeSlotPicker({ slots, value, onChange }: Props) {
  return (
    <Stack spacing={1}>
      <Typography variant="h6" fontWeight={800}>
        Choose a time slot
      </Typography>
      <Grid container spacing={1}>
        {slots.map((s) => {
          const disabled = s.availableConsoleIds.length === 0;
          const selected = value === s.slot;

          return (
            <Grid key={s.slot} size={{ xs: 6, sm: 4, md: 3 }}>
              <Button
                fullWidth
                variant={selected ? "contained" : "outlined"}
                onClick={() => onChange(s.slot)}
                disabled={disabled}
                sx={{
                  py: 1.25,
                  borderRadius: 3,
                  justifyContent: "space-between",
                }}
              >
                <span>{s.slot}</span>
                <Chip
                  size="small"
                  label={
                    s.isPast
                      ? "Passed"
                      : disabled
                        ? "Full"
                        : `${s.tvCapacityRemaining} TV left`
                  }
                  sx={{ ml: 1 }}
                />
              </Button>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}
