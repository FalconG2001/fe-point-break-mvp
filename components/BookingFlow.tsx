"use client";

import * as React from "react";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";

import DateTabs from "./DateTabs";
import TimeSlotPicker from "./TimeSlotPicker";
import ConsoleSelector, { type SelectionState } from "./ConsoleSelector";
import GamesShowcase from "./GamesShowcase";

import {
  todayYmd,
  type ConsoleId,
  CONSOLES,
  type DurationMinutes,
} from "@/lib/config";
import type { AvailabilitySlot } from "@/types";
import TimeSlotSkeleton from "./Skeletons/TimeSlotSkeleton";

interface AvailabilityResponse {
  date: string;
  slots: AvailabilitySlot[];
}

type PricingRow = {
  userType: "normal" | "student";
  category: "session" | "console_rent";
  durationMinutes: number;
  minPlayers: number;
  maxPlayers: number;
  pricingType: "per_person" | "fixed_total";
  price: number;
};

interface BookingFlowProps {
  initialData?: AvailabilityResponse;
  games?: any[];
  pricing?: PricingRow[];
}

function TabPanel(props: {
  value: number;
  index: number;
  children: React.ReactNode;
}) {
  const { value, index, children } = props;
  return (
    <Box role="tabpanel" hidden={value !== index}>
      {value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null}
    </Box>
  );
}

function SummaryBlock({
  date,
  slot,
  selectedConsoles,
  estimateTotal,
  estimateMissing,
  userTypeLabel,
}: {
  date: string;
  slot: string | null;
  selectedConsoles: Array<{
    consoleId: ConsoleId;
    players: number;
    duration: DurationMinutes;
  }>;
  estimateTotal: number;
  estimateMissing: boolean;
  userTypeLabel: string;
}) {
  return (
    <Stack spacing={2}>
      <Typography fontWeight={900}>Your booking</Typography>

      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          Pricing
        </Typography>
        <Typography fontWeight={800}>{userTypeLabel}</Typography>
        {userTypeLabel === "Student" && (
          <Typography variant="caption" color="error" fontWeight={700}>
            Note: You must show a school or college ID
          </Typography>
        )}
      </Stack>

      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          Date
        </Typography>
        <Typography fontWeight={800}>{date}</Typography>
      </Stack>

      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          Time
        </Typography>
        <Typography fontWeight={800}>
          {slot ? slot : "Not picked yet"}
        </Typography>
      </Stack>

      <Stack spacing={0.8}>
        <Typography variant="caption" color="text.secondary">
          Consoles
        </Typography>

        {selectedConsoles.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            None selected
          </Typography>
        ) : (
          <Stack spacing={1}>
            {selectedConsoles.map((s) => (
              <Chip
                key={s.consoleId}
                label={`${CONSOLES.find((c) => c.id === s.consoleId)?.name ?? s.consoleId} • ${s.players}P • ${s.duration}m`}
                sx={{ borderRadius: 1, fontWeight: 800 }}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <Divider />

      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          Estimated total
        </Typography>
        {estimateMissing ? (
          <Typography fontWeight={900} color="error">
            Price not found for one selection
          </Typography>
        ) : (
          <Typography fontWeight={900} sx={{ fontSize: "1.1rem" }}>
            ₹{estimateTotal}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}

export default function BookingFlow({
  initialData,
  games,
  pricing,
}: BookingFlowProps) {
  const [date, setDate] = React.useState(initialData?.date || todayYmd(0));
  const [availability, setAvailability] = React.useState<
    AvailabilitySlot[] | null
  >(initialData?.slots || null);

  const [slot, setSlot] = React.useState<string | null>(null);
  const [selection, setSelection] = React.useState<SelectionState>({});
  const [showFullSlots, setShowFullSlots] = React.useState(false);

  const [userType, setUserType] = React.useState<"normal" | "student">(
    "normal",
  );
  // student is your student mode

  const counts = React.useMemo(() => {
    const s = availability ?? [];
    const past = s.filter((x) => x.isPast).length;
    const full = s.filter(
      (x) => !x.isPast && x.availableConsoleIds.length === 0,
    ).length;
    const open = s.filter(
      (x) => !x.isPast && x.availableConsoleIds.length > 0,
    ).length;
    return { past, full, open, total: s.length };
  }, [availability]);

  // 0 = Slot (date+time), 1 = Consoles, 2 = Details
  const [step, setStep] = React.useState(0);

  const [loadingAvail, setLoadingAvail] = React.useState(false);

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");

  const [bookingLoading, setBookingLoading] = React.useState(false);
  const [bookingError, setBookingError] = React.useState<string | null>(null);

  const [toast, setToast] = React.useState<string | null>(null);

  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const refreshClicks = React.useRef<number[]>([]);

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
      if (v?.selected) {
        arr.push({ consoleId: c.id, players: v.players, duration: v.duration });
      }
    }
    return arr;
  }, [selection]);

  const estimate = React.useMemo(() => {
    const table = pricing ?? [];
    let total = 0;
    let missing = false;

    for (const s of selectedConsoles) {
      const row = table.find((p) => {
        const userOk = p.userType === userType;
        return (
          userOk &&
          p.category === "session" &&
          p.durationMinutes === Number(s.duration) &&
          s.players >= p.minPlayers &&
          s.players <= p.maxPlayers
        );
      });

      if (!row) {
        missing = true;
        continue;
      }

      const line =
        row.pricingType === "per_person" ? row.price * s.players : row.price;

      total += line;
    }

    return { total, missing };
  }, [pricing, selectedConsoles, userType]);

  const maxAllowedStep = React.useMemo(() => {
    // You can always use step 0.
    // Step 1 needs slot.
    // Step 2 needs slot + at least 1 console.
    if (!slot) return 0;
    if (selectedConsoles.length === 0) return 1;
    return 2;
  }, [slot, selectedConsoles.length]);

  function goTo(next: number) {
    // Always allow going backwards.
    if (next > step && next > maxAllowedStep) return;

    setStep(next);
    requestAnimationFrame(() => {
      wrapperRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  async function loadAvailability(nextDate: string) {
    setLoadingAvail(true);
    setAvailability(null);
    setSlot(null);
    setSelection({});
    setBookingError(null);

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

  const handleRefresh = () => {
    const now = Date.now();
    // Keep only clicks within the last 1 second
    refreshClicks.current = refreshClicks.current.filter((t) => now - t < 1000);

    if (refreshClicks.current.length >= 3) {
      setToast("Slow down! Too many refreshes.");
      return;
    }

    refreshClicks.current.push(now);
    loadAvailability(date);
  };

  // On first mount, if no initialData, fetch.
  React.useEffect(() => {
    if (!initialData) loadAvailability(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When date changes, reload slots and keep user in step 0.
  const isInitialDate = React.useRef(true);
  React.useEffect(() => {
    if (isInitialDate.current) {
      isInitialDate.current = false;

      // If we already have initialData for this date, don’t refetch.
      if (initialData && initialData.date === date) return;
    }

    loadAvailability(date).then(() => {
      setStep(0);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function confirmBooking() {
    setBookingLoading(true);
    setBookingError(null);

    try {
      if (!slot) throw new Error("Pick a time slot first.");
      if (estimate.missing)
        throw new Error("Pricing not found for your selection.");
      if (selectedConsoles.length === 0)
        throw new Error("Pick at least 1 console.");
      if (name.trim().length < 2) throw new Error("Enter your name.");
      if (phone.trim().length < 7)
        throw new Error("Enter a valid phone number.");

      const payload = {
        date,
        slot,
        selections: selectedConsoles,
        name: name.trim(),
        phone: phone.trim(),
        userType,
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Booking failed");

      setToast("Booked! See you soon 😄");

      // Reset flow and refresh same date.
      setName("");
      setPhone("");
      setSlot(null);
      setSelection({});
      setStep(0);

      await loadAvailability(date);
    } catch (e: any) {
      setBookingError(e?.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 6 } }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack spacing={1}>
          <Typography variant="h5" fontWeight={900}>
            Point Break Gamer Zone
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Book your gaming slot
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {CONSOLES.map((c) => (
              <Chip
                key={c.id}
                label={c.short}
                size="small"
                sx={{ borderRadius: 1, fontWeight: 800 }}
                variant="outlined"
              />
            ))}
          </Stack>
        </Stack>

        <Grid container spacing={2} ref={wrapperRef}>
          {/* Left: main flow */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 4 },
                borderRadius: 2,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "#fff",
              }}
            >
              <Tabs
                value={step}
                onChange={(_, v) => goTo(v)}
                variant="fullWidth"
                sx={{
                  "& .MuiTab-root": { fontWeight: 900, textTransform: "none" },
                }}
              >
                <Tab label="1) Slot" />
                <Tab label="2) Consoles" disabled={!slot} />
                <Tab
                  label="3) Details"
                  disabled={!slot || selectedConsoles.length === 0}
                />
              </Tabs>

              <Divider sx={{ mt: 2 }} />

              {/* Step 1: Date + Slots together */}
              <TabPanel value={step} index={0}>
                <Stack spacing={2.5}>
                  <Stack spacing={0.5}>
                    <Typography variant="h6" fontWeight={900}>
                      Pick date and time
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tap a slot and we jump you to consoles.
                    </Typography>
                  </Stack>

                  <DateTabs value={date} onChange={setDate} />

                  <Stack direction="row" spacing={1} alignItems="center">
                    {loadingAvail && (
                      <>
                        <CircularProgress size={16} />
                        <Typography variant="caption" color="text.secondary">
                          Loading slots…
                        </Typography>
                      </>
                    )}

                    {!!availability && !loadingAvail && (
                      <Typography variant="caption" color="text.secondary">
                        {counts.open} open • {counts.full} full • {counts.past}{" "}
                        past
                      </Typography>
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    {/* <Button
                      color="inherit"
                      onClick={() => setShowFullSlots((v) => !v)}
                      disabled={loadingAvail || !availability}
                      sx={{ borderRadius: 2, fontWeight: 900 }}
                    >
                      {showFullSlots ? "Hide full" : "Show full"}
                    </Button> */}

                    <Button
                      color="inherit"
                      onClick={handleRefresh}
                      disabled={loadingAvail}
                      sx={{ borderRadius: 2, fontWeight: 900 }}
                    >
                      Refresh
                    </Button>
                  </Stack>

                  {/* Slots area */}
                  {loadingAvail && <TimeSlotSkeleton count={12} />}

                  {!loadingAvail &&
                    availability &&
                    availability.length === 0 && (
                      <Alert severity="info">
                        No slots for this date. Try another day.
                      </Alert>
                    )}

                  {!loadingAvail && availability && availability.length > 0 && (
                    <TimeSlotPicker
                      slots={availability}
                      value={slot}
                      showFull={showFullSlots}
                      showPast={false}
                      onChange={(s) => {
                        setSlot(s);
                        setSelection({});
                        setBookingError(null);
                        setStep(1);
                      }}
                    />
                  )}
                </Stack>
              </TabPanel>

              {/* Step 2: Consoles */}
              <TabPanel value={step} index={1}>
                <Stack spacing={2.5}>
                  <Stack spacing={0.5}>
                    <Typography variant="h6" fontWeight={900}>
                      Choose consoles
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pick consoles, players, and duration.
                    </Typography>
                  </Stack>

                  {!chosenSlot ? (
                    <Alert severity="warning">Pick a slot first.</Alert>
                  ) : (
                    <ConsoleSelector
                      availableConsoleIds={chosenSlot.availableConsoleIds}
                      tvCapacityRemaining={chosenSlot.tvCapacityRemaining}
                      value={selection}
                      onChange={setSelection}
                    />
                  )}

                  <Divider />

                  <Stack direction="row" justifyContent="space-between">
                    <Button
                      color="inherit"
                      onClick={() => goTo(0)}
                      sx={{ borderRadius: 2 }}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      disabled={selectedConsoles.length === 0}
                      onClick={() => goTo(2)}
                      sx={{
                        borderRadius: 2,
                        background: "#000",
                        "&:hover": { background: "#222" },
                      }}
                    >
                      Continue
                    </Button>
                  </Stack>
                </Stack>
              </TabPanel>

              {/* Step 3: Details */}
              <TabPanel value={step} index={2}>
                <Stack spacing={2.5}>
                  <Stack spacing={0.5}>
                    <Typography variant="h6" fontWeight={900}>
                      Your details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Confirm and lock the slot.
                    </Typography>
                  </Stack>

                  <Stack spacing={2}>
                    <TextField
                      label="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      fullWidth
                      variant="filled"
                      hiddenLabel
                      InputProps={{
                        disableUnderline: true,
                        sx: { borderRadius: 2, background: "rgba(0,0,0,0.03)" },
                      }}
                    />
                    <TextField
                      label="Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      fullWidth
                      variant="filled"
                      hiddenLabel
                      InputProps={{
                        disableUnderline: true,
                        sx: { borderRadius: 2, background: "rgba(0,0,0,0.03)" },
                      }}
                    />

                    <FormControl component="fieldset">
                      <FormLabel
                        component="legend"
                        sx={{
                          fontWeight: 900,
                          fontSize: "0.875rem",
                          mb: 1,
                          color: "text.primary",
                        }}
                      >
                        Pricing type
                      </FormLabel>
                      <RadioGroup
                        row
                        value={userType}
                        onChange={(e) =>
                          setUserType(e.target.value as "normal" | "student")
                        }
                      >
                        <FormControlLabel
                          value="normal"
                          control={<Radio size="small" color="primary" />}
                          label={
                            <Typography variant="body2" fontWeight={800}>
                              Normal
                            </Typography>
                          }
                        />
                        <FormControlLabel
                          value="student"
                          control={<Radio size="small" color="primary" />}
                          label={
                            <Typography variant="body2" fontWeight={800}>
                              Student
                            </Typography>
                          }
                        />
                      </RadioGroup>
                    </FormControl>

                    {bookingError && (
                      <Alert severity="error">{bookingError}</Alert>
                    )}
                  </Stack>

                  {/* Mobile summary: show before confirm button */}
                  <Box sx={{ display: { xs: "block", md: "none" } }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid rgba(0,0,0,0.08)",
                        background: "rgba(0,0,0,0.02)",
                      }}
                    >
                      <SummaryBlock
                        date={date}
                        slot={slot}
                        selectedConsoles={selectedConsoles}
                        estimateTotal={estimate.total}
                        estimateMissing={estimate.missing}
                        userTypeLabel={
                          userType === "normal" ? "Normal" : "Student"
                        }
                      />
                    </Paper>
                  </Box>

                  <Divider />

                  <Stack direction="row" justifyContent="space-between">
                    <Button
                      color="inherit"
                      onClick={() => goTo(1)}
                      disabled={bookingLoading}
                      sx={{ borderRadius: 2 }}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={confirmBooking}
                      disabled={bookingLoading || estimate.missing}
                      sx={{
                        borderRadius: 2,
                        px: 3,
                        background: "#000",
                        "&:hover": { background: "#222" },
                      }}
                    >
                      {bookingLoading ? "Booking…" : "Confirm booking"}
                    </Button>
                  </Stack>
                </Stack>
              </TabPanel>
            </Paper>
          </Grid>

          {/* Right: summary */}
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{ display: { xs: "none", md: "block" } }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid rgba(0,0,0,0.08)",
                position: { md: "sticky" },
                top: { md: 24 },
                background: "rgba(0,0,0,0.02)",
              }}
            >
              <SummaryBlock
                date={date}
                slot={slot}
                selectedConsoles={selectedConsoles}
                estimateTotal={estimate.total}
                estimateMissing={estimate.missing}
                userTypeLabel={userType === "normal" ? "Normal" : "Student"}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Games section stays after booking */}
        <GamesShowcase games={games} />

        <Snackbar
          open={!!toast}
          autoHideDuration={3500}
          onClose={() => setToast(null)}
          message={toast ?? ""}
        />
      </Stack>
    </Container>
  );
}
