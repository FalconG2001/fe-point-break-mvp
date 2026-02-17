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
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import {
  CONSOLES,
  DURATION_OPTIONS,
  DURATION_LABELS,
  type ConsoleId,
  type DurationMinutes,
  todayYmd,
  getStartSlotsForDate,
} from "@/lib/config";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: string;
  initialData?: {
    id: string;
    date: string;
    slot: string;
    selections: Array<{
      consoleId: string;
      duration: number;
      players: number;
    }>;
    customer: { name: string; phone: string };
    payments?: Array<{ type: number; amount: number }>;
    totalPrice?: number;
  };
}

export default function AdminCreateBookingDialog({
  open,
  onClose,
  onSuccess,
  defaultDate,
  initialData,
}: Props) {
  const [date, setDate] = React.useState(defaultDate || todayYmd(0));
  const [slot, setSlot] = React.useState("");
  const [consoleId, setConsoleId] = React.useState<ConsoleId | "">("");
  const [duration, setDuration] = React.useState<DurationMinutes>(60);
  const [players, setPlayers] = React.useState(1);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [totalPrice, setTotalPrice] = React.useState<number | "">("");
  const [cashPaid, setCashPaid] = React.useState<number | "">("");
  const [gpayPaid, setGpayPaid] = React.useState<number | "">("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const isEdit = !!initialData;

  // No longer need slotOptions for filtering slots in UI,
  // but we still use it for legacy purposes or internal logic if needed.
  // The user can now pick any time.

  // if user changes date/duration, we just keep the slot as is.
  // The backend will validate conflicts.

  // Reset/Initialize form when dialog opens
  React.useEffect(() => {
    if (open) {
      if (initialData) {
        setDate(initialData.date);
        setSlot(initialData.slot);
        const sel = initialData.selections?.[0];
        if (sel) {
          setConsoleId(sel.consoleId as ConsoleId);
          setDuration(sel.duration as DurationMinutes);
          setPlayers(sel.players);
        }
        setName(initialData.customer?.name || "");
        setPhone(initialData.customer?.phone || "");
        setTotalPrice(
          initialData.totalPrice !== undefined ? initialData.totalPrice : "",
        );
        const cashAmt = initialData.payments?.find((p) => p.type === 2)?.amount;
        const gpayAmt = initialData.payments?.find((p) => p.type === 1)?.amount;
        setCashPaid(cashAmt !== undefined ? cashAmt : "");
        setGpayPaid(gpayAmt !== undefined ? gpayAmt : "");
      } else {
        setDate(defaultDate || todayYmd(0));
        setSlot("10:00");
        setConsoleId("");
        setDuration(60);
        setPlayers(1);
        setName("");
        setPhone("");
        setTotalPrice("");
        setCashPaid("");
        setGpayPaid("");
      }
      setError("");
    }
  }, [open, defaultDate, initialData]);

  const handleSubmit = async () => {
    if (!slot || !consoleId || !name) {
      setError("Please fill in name, slot and console");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        date,
        slot,
        selections: [{ consoleId, duration, players }],
        name,
        phone,
        totalPrice: totalPrice === "" ? 0 : Number(totalPrice),
        bookingFrom: "admin",
        payments: [
          ...(cashPaid !== "" && Number(cashPaid) > 0
            ? [{ type: 2, amount: Number(cashPaid) }]
            : []),
          ...(gpayPaid !== "" && Number(gpayPaid) > 0
            ? [{ type: 1, amount: Number(gpayPaid) }]
            : []),
        ],
        ...(isEdit ? { id: initialData?.id } : {}),
      };

      const res = await fetch("/api/bookings", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const detailError = data.details?.fieldErrors
          ? (Object.values(data.details.fieldErrors).flat()[0] as string)
          : null;
        throw new Error(
          detailError ||
            data.error ||
            `Failed to ${isEdit ? "update" : "create"} booking`,
        );
      }

      onSuccess();
      onClose();
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : `Failed to ${isEdit ? "update" : "create"} booking`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? "Edit Booking" : "Create Walk-in Booking"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date"
              value={dayjs(date)}
              onChange={(newValue: Dayjs | null) => {
                if (newValue) {
                  setDate(newValue.format("YYYY-MM-DD"));
                }
              }}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                },
              }}
            />

            <TimePicker
              label="Start Time"
              value={slot ? dayjs(`${date}T${slot}`) : null}
              onChange={(newValue: Dayjs | null) => {
                if (newValue) {
                  setSlot(newValue.format("HH:mm"));
                }
              }}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                },
              }}
              minTime={dayjs(`${date}T10:00`)}
              maxTime={dayjs(`${date}T21:00`)}
            />
          </LocalizationProvider>

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
          />

          <TextField
            size="small"
            label="Total Price (₹)"
            type="number"
            value={totalPrice}
            onChange={(e) =>
              setTotalPrice(e.target.value === "" ? "" : Number(e.target.value))
            }
            required
          />

          <Stack direction="row" spacing={2}>
            <TextField
              size="small"
              label="Cash Paid (₹)"
              type="number"
              value={cashPaid}
              onChange={(e) =>
                setCashPaid(e.target.value === "" ? "" : Number(e.target.value))
              }
              fullWidth
            />
            <TextField
              size="small"
              label="GPay Paid (₹)"
              type="number"
              value={gpayPaid}
              onChange={(e) =>
                setGpayPaid(e.target.value === "" ? "" : Number(e.target.value))
              }
              fullWidth
            />
          </Stack>
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
          {isEdit ? "Update Booking" : "Create Booking"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
