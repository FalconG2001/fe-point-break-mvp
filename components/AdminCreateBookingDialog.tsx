"use client";

import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  CONSOLES,
  DURATION_OPTIONS,
  DURATION_LABELS,
  type ConsoleId,
  type DurationMinutes,
  todayYmd,
  isSlotPast,
  getStartSlotsForDate,
} from "@/lib/config";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: string;
}

export default function AdminCreateBookingDialog({
  open,
  onClose,
  onSuccess,
  defaultDate,
}: Props) {
  const [date, setDate] = React.useState(defaultDate || todayYmd(0));
  const [slot, setSlot] = React.useState("");
  const [consoleId, setConsoleId] = React.useState<ConsoleId | "">("");
  const [duration, setDuration] = React.useState<DurationMinutes>(60);
  const [players, setPlayers] = React.useState(1);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const slotOptions = React.useMemo(
    () =>
      getStartSlotsForDate(date, duration).filter((s) => !isSlotPast(date, s)),
    [date, duration],
  );

  // if user changes date/duration and the chosen slot becomes invalid, clear it
  React.useEffect(() => {
    if (slot && !slotOptions.includes(slot)) setSlot("");
  }, [slot, slotOptions]);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setDate(defaultDate || todayYmd(0));
      setSlot("");
      setConsoleId("");
      setDuration(60);
      setPlayers(1);
      setName("");
      setPhone("");
      setError("");
    }
  }, [open, defaultDate]);

  const dates = [
    { value: todayYmd(0), label: "Today" },
    { value: todayYmd(1), label: "Tomorrow" },
    { value: todayYmd(2), label: "Day After" },
  ];

  const handleSubmit = async () => {
    if (!slot || !consoleId || !name || !phone) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          slot,
          selections: [{ consoleId, duration, players }],
          name,
          phone,
          bookingFrom: "admin",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const detailError = data.details?.fieldErrors
          ? (Object.values(data.details.fieldErrors).flat()[0] as string)
          : null;
        throw new Error(
          detailError || data.error || "Failed to create booking",
        );
      }

      onSuccess();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Walk-in Booking</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <FormControl fullWidth size="small">
            <InputLabel>Date</InputLabel>
            <Select
              value={date}
              label="Date"
              onChange={(e) => setDate(e.target.value)}
            >
              {dates.map((d) => (
                <MenuItem key={d.value} value={d.value}>
                  {d.label} ({d.value})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Time Slot</InputLabel>
            <Select
              value={slot}
              label="Time Slot"
              onChange={(e) => setSlot(e.target.value)}
            >
              {slotOptions.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Console</InputLabel>
            <Select
              value={consoleId}
              label="Console"
              onChange={(e) => setConsoleId(e.target.value as ConsoleId)}
            >
              {CONSOLES.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Duration</InputLabel>
            <Select
              value={duration}
              label="Duration"
              onChange={(e) => setDuration(e.target.value as DurationMinutes)}
            >
              {DURATION_OPTIONS.map((d) => (
                <MenuItem key={d} value={d}>
                  {DURATION_LABELS[d]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Number of Players"
            type="number"
            value={players}
            onChange={(e) => setPlayers(Number(e.target.value) || 1)}
            inputProps={{ min: 1, max: 6 }}
          />

          <TextField
            size="small"
            label="Customer Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <TextField
            size="small"
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          Create Booking
        </Button>
      </DialogActions>
    </Dialog>
  );
}
