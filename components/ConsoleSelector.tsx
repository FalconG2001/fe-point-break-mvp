"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Grid from "@mui/material/Grid";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import {
  CONSOLES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  type ConsoleId,
  DURATION_OPTIONS,
  DURATION_LABELS,
  type DurationMinutes,
} from "@/lib/config";

export type SelectionState = Record<
  string,
  { selected: boolean; players: number; duration: DurationMinutes }
>;

type Props = {
  availableConsoleIds: ConsoleId[];
  tvCapacityRemaining: number;
  value: SelectionState;
  onChange: (next: SelectionState) => void;
};

const DEFAULT_DURATION: DurationMinutes = 60;

const BRAND_COLORS: Record<string, string> = {
  ps5: "#0072ce",
  xbox: "#107c10",
  switch: "#e60012",
  pc: "#6366f1",
};

export default function ConsoleSelector({
  availableConsoleIds,
  tvCapacityRemaining,
  value,
  onChange,
}: Props) {
  const maxPick = tvCapacityRemaining;
  const pickedCount = Object.values(value).filter((v) => v.selected).length;

  const canPickMore = pickedCount < maxPick;

  const toggle = (id: ConsoleId, checked: boolean) => {
    const prev = value[id] ?? {
      selected: false,
      players: MIN_PLAYERS,
      duration: DEFAULT_DURATION,
    };
    if (checked && !canPickMore) return;

    onChange({
      ...value,
      [id]: { ...prev, selected: checked },
    });
  };

  if (availableConsoleIds.length === 0) {
    return (
      <Paper
        sx={{
          p: 3,
          borderRadius: 1,
          background: "rgba(239, 68, 68, 0.05)",
          border: "1px solid rgba(239, 68, 68, 0.1)",
        }}
      >
        <Typography variant="body2" color="error">
          No consoles available in this slot.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="h6" fontWeight={800} sx={{ fontSize: "1rem" }}>
          Choose Consoles
        </Typography>
        <Chip
          label={`${pickedCount} / ${maxPick} Selected`}
          size="small"
          sx={{
            fontWeight: 700,
            borderRadius: 0.5,
            background: "rgba(0,0,0,0.05)",
            color: "text.primary",
          }}
        />
      </Stack>

      <Grid container spacing={2}>
        {CONSOLES.filter((c) => availableConsoleIds.includes(c.id)).map((c) => {
          const item = value[c.id] ?? {
            selected: false,
            players: MIN_PLAYERS,
            duration: DEFAULT_DURATION,
          };
          const disabled = !item.selected && !canPickMore;

          return (
            <Grid key={c.id} size={{ xs: 12, sm: 6 }}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 1,
                  border: item.selected
                    ? `1px solid #000`
                    : "1px solid rgba(0, 0, 0, 0.08)",
                  background: item.selected ? "rgba(0, 0, 0, 0.02)" : "#ffffff",
                  transition: "all 0.2s ease",
                  opacity: disabled ? 0.4 : 1,
                  "&:hover": {
                    borderColor: item.selected ? "#000" : "rgba(0, 0, 0, 0.2)",
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack spacing={2.5}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={item.selected}
                          onChange={(e) => toggle(c.id, e.target.checked)}
                          disabled={disabled}
                          sx={{
                            color: "rgba(0,0,0,0.1)",
                            "&.Mui-checked": { color: "#000" },
                          }}
                        />
                      }
                      label={
                        <Typography fontWeight={800} variant="subtitle2">
                          {c.name}
                        </Typography>
                      }
                    />

                    <Stack direction="row" spacing={1.5}>
                      <FormControl
                        size="small"
                        fullWidth
                        disabled={!item.selected}
                      >
                        <InputLabel>Players</InputLabel>
                        <Select
                          label="Players"
                          value={item.players}
                          onChange={(e) =>
                            onChange({
                              ...value,
                              [c.id]: {
                                ...item,
                                players: Number(e.target.value),
                              },
                            })
                          }
                          sx={{ borderRadius: 1, background: "#fff" }}
                        >
                          {Array.from({
                            length: MAX_PLAYERS - MIN_PLAYERS + 1,
                          }).map((_, i) => {
                            const v = MIN_PLAYERS + i;
                            return (
                              <MenuItem key={v} value={v}>
                                {v} {v === 1 ? "Player" : "Players"}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>

                      <FormControl
                        size="small"
                        fullWidth
                        disabled={!item.selected}
                      >
                        <InputLabel>Duration</InputLabel>
                        <Select
                          label="Duration"
                          value={item.duration}
                          onChange={(e) =>
                            onChange({
                              ...value,
                              [c.id]: {
                                ...item,
                                duration: Number(
                                  e.target.value,
                                ) as DurationMinutes,
                              },
                            })
                          }
                          sx={{ borderRadius: 1, background: "#fff" }}
                        >
                          {DURATION_OPTIONS.map((d) => (
                            <MenuItem key={d} value={d}>
                              {DURATION_LABELS[d]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>

                    <Typography variant="caption" color="text.secondary">
                      {c.notes}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}
