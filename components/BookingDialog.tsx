"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import type { ConsoleId, DurationMinutes } from "@/lib/config";
import { CONSOLES, DURATION_LABELS } from "@/lib/config";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; phone: string }) => Promise<void>;
  loading: boolean;
  error: string | null;
  summary: {
    date: string;
    slot: string;
    selections: Array<{
      consoleId: ConsoleId;
      players: number;
      duration: DurationMinutes;
    }>;
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
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 1,
          background: "#ffffff",
          backgroundImage: "none",
          border: "1px solid rgba(0, 0, 0, 0.1)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", pt: 4 }}>
        <Typography variant="h5" fontWeight={900}>
          Confirm Booking
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 4 }}>
        <Stack spacing={4} sx={{ mt: 1 }}>
          <Paper
            sx={{
              p: 2.5,
              borderRadius: 1,
              background: "rgba(0, 0, 0, 0.02)",
              border: "1px solid rgba(0, 0, 0, 0.05)",
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  Schedule
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {summary.date} @ {summary.slot}
                </Typography>
              </Stack>
              <Divider />
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">
                  Consoles
                </Typography>
                {summary.selections.map((s) => (
                  <Stack
                    key={s.consoleId}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <Typography variant="body2" fontWeight={700}>
                      {CONSOLES.find((c) => c.id === s.consoleId)?.name ??
                        s.consoleId}
                    </Typography>
                    <Chip
                      label={`${s.players}P • ${DURATION_LABELS[s.duration]}`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.65rem",
                        borderRadius: 0.5,
                        background: "rgba(0,0,0,0.05)",
                      }}
                    />
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Paper>

          <Stack spacing={2.5}>
            <TextField
              label="What's your name?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              fullWidth
              variant="filled"
              hiddenLabel
              InputProps={{
                disableUnderline: true,
                sx: { borderRadius: 1, background: "rgba(0, 0, 0, 0.03)" },
              }}
            />
            <TextField
              label="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              fullWidth
              variant="filled"
              InputProps={{
                disableUnderline: true,
                sx: { borderRadius: 1, background: "rgba(0, 0, 0, 0.03)" },
              }}
            />
            {error && (
              <Alert severity="error" sx={{ borderRadius: 1 }}>
                {error}
              </Alert>
            )}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{ px: 4, pb: 4, pt: 2, justifyContent: "space-between" }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          color="inherit"
          sx={{ fontSize: "0.8rem" }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => onConfirm({ name, phone })}
          disabled={!canSubmit}
          sx={{
            borderRadius: 1,
            px: 4,
            py: 1.2,
            background: "#000",
            color: "#fff",
            "&:hover": { background: "#222" },
          }}
        >
          {loading ? "Confirming..." : "Confirm & Book"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
