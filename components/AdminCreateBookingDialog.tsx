"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
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
} from "@/lib/config";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";

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
    customer: { name: string; phone: string; userType: "normal" | "student" };
    payments?: Array<{ type: number; amount: number }>;
    totalPrice?: number;
    userType?: "normal" | "student";
  };
  pricing?: any[];
}

export default function AdminCreateBookingDialog({
  open,
  onClose,
  onSuccess,
  defaultDate,
  initialData,
  pricing,
}: Props) {
  const [date, setDate] = React.useState(defaultDate || todayYmd(0));
  const [slot, setSlot] = React.useState("");
  const [selections, setSelections] = React.useState<
    Array<{
      consoleId: ConsoleId | "";
      duration: DurationMinutes;
      players: number;
    }>
  >([{ consoleId: "", duration: 60, players: 1 }]);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [userType, setUserType] = React.useState<"normal" | "student">(
    initialData?.customer?.userType || "normal",
  );
  const [totalPrice, setTotalPrice] = React.useState<number | "">("");
  const [isPriceModified, setIsPriceModified] = React.useState(false);
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
        if (initialData.selections && initialData.selections.length > 0) {
          setSelections(
            initialData.selections.map((s) => ({
              consoleId: s.consoleId as ConsoleId,
              duration: s.duration as DurationMinutes,
              players: s.players,
            })),
          );
        } else {
          setSelections([{ consoleId: "", duration: 60, players: 1 }]);
        }
        setName(initialData.customer?.name || "");
        setPhone(initialData.customer?.phone || "");
        setUserType(initialData.customer?.userType || "normal");
        setTotalPrice(
          initialData.totalPrice !== undefined ? initialData.totalPrice : "",
        );
        setIsPriceModified(true); // Don't auto-calc if editing existing
        const cashAmt = initialData.payments?.find((p) => p.type === 2)?.amount;
        const gpayAmt = initialData.payments?.find((p) => p.type === 1)?.amount;
        setCashPaid(cashAmt !== undefined ? cashAmt : "");
        setGpayPaid(gpayAmt !== undefined ? gpayAmt : "");
      } else {
        setDate(defaultDate || todayYmd(0));
        setSlot("10:00");
        setSelections([{ consoleId: "", duration: 60, players: 1 }]);
        setName("");
        setPhone("");
        setUserType("normal");
        setTotalPrice("");
        setIsPriceModified(false); // Reset to allow auto-calc for NEW bookings
        setCashPaid("");
        setGpayPaid("");
      }
      setError("");
    }
  }, [open, defaultDate, initialData]);

  // Reset isPriceModified when selections or userType change to allow re-calculation,
  // but only if we ARE in a state where we want auto-sync (e.g. not immediately after opening an edit)
  const lastDeps = React.useRef({ selections, userType });
  React.useEffect(() => {
    const depsChanged =
      JSON.stringify(lastDeps.current.selections) !==
        JSON.stringify(selections) || lastDeps.current.userType !== userType;

    if (depsChanged && open) {
      setIsPriceModified(false);
    }
    lastDeps.current = { selections, userType };
  }, [selections, userType, open]);

  // Auto-fill pricing logic
  React.useEffect(() => {
    if (isPriceModified || !pricing || pricing.length === 0) return;

    let total = 0;
    let missing = false;

    for (const s of selections) {
      if (!s.consoleId) continue;

      const row = pricing.find((p) => {
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
        break;
      }

      const line =
        row.pricingType === "per_person" ? row.price * s.players : row.price;
      total += line;
    }

    if (!missing && total > 0) {
      setTotalPrice(total);
    }
  }, [selections, userType, pricing, isPriceModified]);

  const handleSubmit = async () => {
    const hasInvalidSelection = selections.some((s) => !s.consoleId);
    if (!slot || hasInvalidSelection || !name) {
      setError(
        "Please fill in name, slot and pick consoles for all selections",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        date,
        slot,
        selections: selections.filter((s) => s.consoleId !== ""),
        name,
        phone,
        userType,
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

          <Box sx={{ mb: 1 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                Consoles
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() =>
                  setSelections([
                    ...selections,
                    { consoleId: "", duration: 60, players: 1 },
                  ])
                }
              >
                Add Console
              </Button>
            </Stack>

            <Stack spacing={2}>
              {selections.map((sel, index) => (
                <Stack
                  key={index}
                  spacing={1}
                  sx={{
                    p: 1.5,
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: 1,
                    position: "relative",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <FormControl fullWidth size="small">
                      <InputLabel>Console</InputLabel>
                      <Select
                        value={sel.consoleId}
                        label="Console"
                        onChange={(e) => {
                          const newSels = [...selections];
                          newSels[index].consoleId = e.target
                            .value as ConsoleId;
                          setSelections(newSels);
                        }}
                      >
                        {CONSOLES.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {selections.length > 1 && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          const newSels = selections.filter(
                            (_, i) => i !== index,
                          );
                          setSelections(newSels);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Duration</InputLabel>
                      <Select
                        value={sel.duration}
                        label="Duration"
                        onChange={(e) => {
                          const newSels = [...selections];
                          newSels[index].duration = e.target
                            .value as DurationMinutes;
                          setSelections(newSels);
                        }}
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
                      label="Players"
                      type="number"
                      value={sel.players}
                      onChange={(e) => {
                        const newSels = [...selections];
                        newSels[index].players = Number(e.target.value) || 1;
                        setSelections(newSels);
                      }}
                      // inputProps={{ min: 1, max: 6 }}
                      fullWidth
                    />
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Divider />

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

          <FormControl component="fieldset">
            <FormLabel
              component="legend"
              sx={{
                fontWeight: 700,
                fontSize: "0.85rem",
                mb: 0.5,
                color: "text.primary",
              }}
            >
              Pricing Type
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
                control={<Radio size="small" />}
                label={<Typography variant="body2">Normal</Typography>}
              />
              <FormControlLabel
                value="student"
                control={<Radio size="small" />}
                label={<Typography variant="body2">Student</Typography>}
              />
            </RadioGroup>
          </FormControl>

          <TextField
            size="small"
            label={isPriceModified ? "Total Price (₹)" : "Estimated Price (₹)"}
            type="number"
            value={totalPrice}
            onChange={(e) => {
              setTotalPrice(
                e.target.value === "" ? "" : Number(e.target.value),
              );
              setIsPriceModified(true);
            }}
            required
            helperText={
              !isPriceModified && totalPrice !== ""
                ? "Auto-calculated based on selections"
                : ""
            }
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
