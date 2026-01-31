"use client";

import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
  Typography,
} from "@mui/material";
import type { ConsoleId } from "@/lib/config";
import { CONSOLES } from "@/lib/config";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; phone: string }) => Promise<void>;
  loading: boolean;
  error: string | null;
  summary: {
    date: string;
    slot: string;
    selections: Array<{ consoleId: ConsoleId; players: number }>;
  };
};

export default function BookingDialog({
  open,
  onClose,
  onConfirm,
  loading,
  error,
  summary,
}: Props) {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setName("");
      setPhone("");
    }
  }, [open]);

  const canSubmit =
    name.trim().length >= 2 && phone.trim().length >= 7 && !loading;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Confirm booking</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {summary.date} • {summary.slot}
          </Typography>
          <Stack spacing={0.5}>
            {summary.selections.map((s) => (
              <Typography key={s.consoleId} variant="body2">
                •{" "}
                {CONSOLES.find((c) => c.id === s.consoleId)?.name ??
                  s.consoleId}{" "}
                — {s.players} players
              </Typography>
            ))}
          </Stack>
          <TextField
            label="Booking name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Eg: Rahul"
            fullWidth
          />
          <TextField
            label="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Eg: +91 98765 43210"
            fullWidth
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => onConfirm({ name, phone })}
          disabled={!canSubmit}
        >
          {loading ? "Booking..." : "Book now"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
