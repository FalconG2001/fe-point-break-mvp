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

import { todayYmd, type ConsoleId, CONSOLES } from "@/lib/config";
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
    const arr: Array<{ consoleId: ConsoleId; players: number }> = [];
    for (const c of CONSOLES) {
      const v = selection[c.id];
      if (v?.selected) arr.push({ consoleId: c.id, players: v.players });
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
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
      <Stack spacing={3}>
        <ConsoleCards />
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Stack spacing={2} sx={{ mt: 2 }}>
            <Typography variant="h6" fontWeight={800}>
              Choose a date
            </Typography>

            <DateTabs value={date} onChange={setDate} />

            <Divider />

            {loadingAvail && (
              <Alert severity="info">Loading availability...</Alert>
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
              <Alert severity="info">
                Pick a slot first. Then you can choose consoles.
              </Alert>
            )}

            <Divider />

            <Button
              variant="contained"
              size="large"
              disabled={!canContinue}
              onClick={() => setConfirmOpen(true)}
              sx={{ borderRadius: 3, py: 1.4 }}
            >
              Continue
            </Button>

            <Typography variant="caption" color="text.secondary">
              If a slot is full, it means all TVs are already booked.
            </Typography>
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
