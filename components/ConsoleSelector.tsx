"use client";

import {
  Card,
  CardContent,
  Typography,
  Stack,
  FormControlLabel,
  Checkbox,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from "@mui/material";
import {
  CONSOLES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  type ConsoleId,
  TV_COUNT,
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

  const setPlayers = (id: ConsoleId, players: number) => {
    const prev = value[id] ?? {
      selected: false,
      players: MIN_PLAYERS,
      duration: DEFAULT_DURATION,
    };
    onChange({
      ...value,
      [id]: { ...prev, players },
    });
  };

  const setDuration = (id: ConsoleId, duration: DurationMinutes) => {
    const prev = value[id] ?? {
      selected: false,
      players: MIN_PLAYERS,
      duration: DEFAULT_DURATION,
    };
    onChange({
      ...value,
      [id]: { ...prev, duration },
    });
  };

  if (availableConsoleIds.length === 0) {
    return <Alert severity="info">No consoles available in this slot.</Alert>;
  }

  return (
    <Stack spacing={1}>
      <Typography variant="h6" fontWeight={800}>
        Pick consoles (max {maxPick})
      </Typography>
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
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={item.selected}
                          onChange={(e) => toggle(c.id, e.target.checked)}
                          disabled={disabled}
                        />
                      }
                      label={<Typography fontWeight={700}>{c.name}</Typography>}
                    />

                    <Stack direction="row" spacing={1}>
                      <FormControl
                        size="small"
                        sx={{ minWidth: 100 }}
                        disabled={!item.selected}
                      >
                        <InputLabel>Players</InputLabel>
                        <Select
                          label="Players"
                          value={item.players}
                          onChange={(e) =>
                            setPlayers(c.id, Number(e.target.value))
                          }
                        >
                          {Array.from({
                            length: MAX_PLAYERS - MIN_PLAYERS + 1,
                          }).map((_, i) => {
                            const v = MIN_PLAYERS + i;
                            return (
                              <MenuItem key={v} value={v}>
                                {v}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>

                      <FormControl
                        size="small"
                        sx={{ minWidth: 120 }}
                        disabled={!item.selected}
                      >
                        <InputLabel>Duration</InputLabel>
                        <Select
                          label="Duration"
                          value={item.duration}
                          onChange={(e) =>
                            setDuration(
                              c.id,
                              Number(e.target.value) as DurationMinutes,
                            )
                          }
                        >
                          {DURATION_OPTIONS.map((d) => (
                            <MenuItem key={d} value={d}>
                              {DURATION_LABELS[d]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {c.notes}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      {pickedCount >= maxPick && (
        <Alert severity="warning">
          You reached TV limit for this slot. Uncheck one console to pick
          another.
        </Alert>
      )}
    </Stack>
  );
}
