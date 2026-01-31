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
} from "@/lib/config";

export type SelectionState = Record<
  string,
  { selected: boolean; players: number }
>;

type Props = {
  availableConsoleIds: ConsoleId[];
  tvCapacityRemaining: number;
  value: SelectionState;
  onChange: (next: SelectionState) => void;
};

export default function ConsoleSelector({
  availableConsoleIds,
  tvCapacityRemaining,
  value,
  onChange,
}: Props) {
  const maxPick = tvCapacityRemaining; // after existing bookings
  const pickedCount = Object.values(value).filter((v) => v.selected).length;

  const canPickMore = pickedCount < maxPick;

  const toggle = (id: ConsoleId, checked: boolean) => {
    const prev = value[id] ?? { selected: false, players: MIN_PLAYERS };
    // If trying to select beyond capacity, block
    if (checked && !canPickMore) return;

    onChange({
      ...value,
      [id]: { ...prev, selected: checked },
    });
  };

  const setPlayers = (id: ConsoleId, players: number) => {
    const prev = value[id] ?? { selected: false, players: MIN_PLAYERS };
    onChange({
      ...value,
      [id]: { ...prev, players },
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
      Always show details
      <Grid container spacing={2}>
        {CONSOLES.filter((c) => availableConsoleIds.includes(c.id)).map((c) => {
          const item = value[c.id] ?? { selected: false, players: MIN_PLAYERS };
          const disabled = !item.selected && !canPickMore;

          return (
            <Grid key={c.id} size={{ xs: 12, sm: 6 }}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
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
                    <FormControl
                      size="small"
                      sx={{ minWidth: 120 }}
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
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    {c.notes}
                  </Typography>
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
