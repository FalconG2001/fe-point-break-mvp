"use client";

import * as React from "react";
import {
  Container,
  Stack,
  Typography,
  Alert,
  Button,
  Divider,
  Snackbar,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from "@mui/material";
import ConsoleCards from "./ConsoleCards";
import DateTabs from "./DateTabs";
import TimeSlotPicker from "./TimeSlotPicker";
import ConsoleSelector, { type SelectionState } from "./ConsoleSelector";
import BookingDialog from "./BookingDialog";

import {
  todayYmd,
  type ConsoleId,
  CONSOLES,
  type DurationMinutes,
} from "@/lib/config";
import type { AvailabilitySlot } from "@/types";

type AvailabilityResponse = {
  date: string;
  slots: AvailabilitySlot[];
};

export default function BookingFlow() {
  const [date, setDate] = React.useState(todayYmd(0));
  const [availability, setAvailability] = React.useState<
    AvailabilitySlot[] | null
  >(null);
  const [slot, setSlot] = React.useState<string | null>(null);
  const [selection, setSelection] = React.useState<SelectionState>({});
  const [loadingAvail, setLoadingAvail] = React.useState(false);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [bookingLoading, setBookingLoading] = React.useState(false);
  const [bookingError, setBookingError] = React.useState<string | null>(null);

  const [toast, setToast] = React.useState<string | null>(null);

  const steps = ["Date", "Time slot", "Consoles", "Confirm"];
  const activeStep = confirmOpen ? 3 : slot ? 2 : availability ? 1 : 0;

  async function loadAvailability(nextDate: string) {
    setLoadingAvail(true);
    setAvailability(null);
    setSlot(null);
    setSelection({});
    try {
      const res = await fetch(
        `/api/availability?date=${encodeURIComponent(nextDate)}`,
      );
      const json = (await res.json()) as AvailabilityResponse & {
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Failed to load availability");
      setAvailability(json.slots);
    } catch (e: any) {
      setAvailability([]);
      setToast(e?.message || "Failed to load availability");
    } finally {
      setLoadingAvail(false);
    }
  }

  React.useEffect(() => {
    loadAvailability(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const chosenSlot = React.useMemo(() => {
    if (!availability || !slot) return null;
    return availability.find((s) => s.slot === slot) ?? null;
  }, [availability, slot]);

  const selectedConsoles = React.useMemo(() => {
    const arr: Array<{
      consoleId: ConsoleId;
      players: number;
      duration: DurationMinutes;
    }> = [];
    for (const c of CONSOLES) {
      const v = selection[c.id];
      if (v?.selected)
        arr.push({ consoleId: c.id, players: v.players, duration: v.duration });
    }
    return arr;
  }, [selection]);

  const canContinue = !!slot && selectedConsoles.length > 0;

  async function confirmBooking(data: { name: string; phone: string }) {
    setBookingLoading(true);
    setBookingError(null);
    try {
      const payload = {
        date,
        slot,
        selections: selectedConsoles,
        name: data.name.trim(),
        phone: data.phone.trim(),
      };
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.error || "Booking failed";
        throw new Error(msg);
      }

      setConfirmOpen(false);
      setToast("Booked! See you soon 😄");

      // Refresh availability and clear selection
      await loadAvailability(date);
      setSlot(null);
      setSelection({});
    } catch (e: any) {
      setBookingError(e?.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, sm: 8 } }}>
      <Stack spacing={4}>
        <ConsoleCards />

        <Paper
          className="glass-panel"
          elevation={0}
          sx={{
            p: { xs: 3, sm: 6 },
            borderRadius: 1,
            background: "rgba(255, 255, 255, 0.5)",
          }}
        >
          <Stepper
            activeStep={activeStep}
            alternativeLabel
            sx={{
              mb: 6,
              "& .MuiStepLabel-label": {
                fontWeight: 700,
                mt: 1,
                fontSize: "0.85rem",
                color: "text.secondary",
                "&.Mui-active": { color: "text.primary" },
                "&.Mui-completed": { color: "text.primary" },
              },
              "& .MuiStepIcon-root": {
                width: 24,
                height: 24,
                color: "rgba(0,0,0,0.05)",
                "&.Mui-active": { color: "text.primary" },
                "&.Mui-completed": { color: "text.primary" },
                "& .MuiStepIcon-text": { fill: "#fff" },
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Stack spacing={4}>
            <Stack spacing={1}>
              <Typography variant="h6" fontWeight={800} color="text.primary">
                Secure your slot
              </Typography>
              <DateTabs value={date} onChange={setDate} />
            </Stack>

            <Divider />

            {loadingAvail && (
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ py: 4, justifyContent: "center" }}
              >
                <Typography variant="body2" color="text.secondary">
                  Accessing availability...
                </Typography>
              </Stack>
            )}

            {!loadingAvail && availability && (
              <TimeSlotPicker
                slots={availability}
                value={slot}
                onChange={(s) => {
                  setSlot(s);
                  setSelection({});
                }}
              />
            )}

            <Divider />

            {chosenSlot ? (
              <ConsoleSelector
                availableConsoleIds={chosenSlot.availableConsoleIds}
                tvCapacityRemaining={chosenSlot.tvCapacityRemaining}
                value={selection}
                onChange={setSelection}
              />
            ) : (
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 1,
                  textAlign: "center",
                  background: "rgba(0, 0, 0, 0.01)",
                  border: "1px dashed rgba(0, 0, 0, 0.1)",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Pick a time slot first to see available consoles.
                </Typography>
              </Paper>
            )}

            <Divider />

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ maxWidth: "60%" }}
              >
                Select your preferred consoles and duration. We'll handle the
                rest.
              </Typography>
              <Button
                variant="contained"
                size="large"
                disabled={!canContinue}
                onClick={() => setConfirmOpen(true)}
                sx={{
                  borderRadius: 1,
                  px: 6,
                  py: 1.5,
                  fontSize: "0.95rem",
                  background: "#000",
                  color: "#fff",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  "&:hover": {
                    background: "#222",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                Proceed to Booking
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>

      <BookingDialog
        open={confirmOpen}
        onClose={() => (bookingLoading ? null : setConfirmOpen(false))}
        onConfirm={confirmBooking}
        loading={bookingLoading}
        error={bookingError}
        summary={{
          date,
          slot: slot ?? "",
          selections: selectedConsoles,
        }}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        message={toast ?? ""}
      />
    </Container>
  );
}
