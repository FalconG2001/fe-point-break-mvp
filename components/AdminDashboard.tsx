"use client";

import * as React from "react";
import {
  Container,
  Stack,
  Typography,
  Alert,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import RestoreIcon from "@mui/icons-material/Restore";
import AddIcon from "@mui/icons-material/Add";
import { signOut } from "next-auth/react";
import DateTabs from "./DateTabs";
import { todayYmd, CONSOLES } from "@/lib/config";
import AdminCreateBookingDialog from "./AdminCreateBookingDialog";

type SelectionWithDuration = {
  consoleId: string;
  players: number;
  duration: number;
  durationLabel: string;
};

type AdminBooking = {
  id: string;
  date: string;
  slot: string;
  selections: SelectionWithDuration[];
  customer: { name: string; phone: string };
  confirmed: boolean;
  createdAt: string;
  bookingFrom?: "website" | "whatsapp" | "admin";
};

type ApiResp = {
  date: string;
  totalBookings: number;
  totalConsolesBooked: number;
  totalPlayers: number;
  bookings: AdminBooking[];
  error?: string;
};

export default function AdminDashboard() {
  const [date, setDate] = React.useState(todayYmd(0));
  const [data, setData] = React.useState<ApiResp | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  async function load(d: string) {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(
        `/api/admin/bookings?date=${encodeURIComponent(d)}`,
      );
      const json = (await res.json()) as ApiResp;
      if (!res.ok) throw new Error(json.error || "Failed to load admin data");
      setData(json);
    } catch (e: any) {
      setData({
        date: d,
        totalBookings: 0,
        totalConsolesBooked: 0,
        totalPlayers: 0,
        bookings: [],
        error: e?.message || "Failed",
      });
    } finally {
      setLoading(false);
    }
  }

  async function toggleConfirmed(bookingId: string, newConfirmed: boolean) {
    setActionLoading(bookingId);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, confirmed: newConfirmed }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to update booking");
      }
      // Reload data
      await load(date);
    } catch (e: any) {
      alert(e?.message || "Failed to update");
    } finally {
      setActionLoading(null);
    }
  }

  React.useEffect(() => {
    load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const consoleName = (id: string) =>
    CONSOLES.find((c) => c.id === id)?.short ?? id;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h5" fontWeight={900}>
            Admin dashboard
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ borderRadius: 3 }}
            >
              Create Booking
            </Button>
            <Button
              variant="outlined"
              onClick={() => signOut()}
              sx={{ borderRadius: 3 }}
            >
              Sign out
            </Button>
          </Stack>
        </Stack>

        <DateTabs value={date} onChange={setDate} />

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4 }}>
          {loading && <Alert severity="info">Loading…</Alert>}

          {!loading && data?.error && (
            <Alert severity="error">{data.error}</Alert>
          )}

          {!loading && data && !data.error && (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Chip
                  label={`Active Bookings: ${data.totalBookings}`}
                  color="primary"
                />
                <Chip label={`Consoles booked: ${data.totalConsolesBooked}`} />
                <Chip label={`Players: ${data.totalPlayers}`} />
              </Stack>

              <Divider />

              {data.bookings.length === 0 ? (
                <Alert severity="info">No bookings for this day.</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Booked by</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Consoles & Duration</TableCell>
                      <TableCell align="right">Players</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.bookings.map((b) => (
                      <TableRow
                        key={b.id}
                        sx={{
                          opacity: b.confirmed ? 1 : 0.5,
                          backgroundColor: b.confirmed
                            ? "inherit"
                            : "action.hover",
                        }}
                      >
                        <TableCell>
                          <Chip
                            size="small"
                            label={b.confirmed ? "Active" : "Cancelled"}
                            color={b.confirmed ? "success" : "error"}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={b.bookingFrom || "website"}
                            color={
                              b.bookingFrom === "whatsapp"
                                ? "success"
                                : b.bookingFrom === "admin"
                                  ? "warning"
                                  : "default"
                            }
                          />
                        </TableCell>
                        <TableCell>{b.slot}</TableCell>
                        <TableCell>{b.customer?.name ?? ""}</TableCell>
                        <TableCell>{b.customer?.phone ?? ""}</TableCell>
                        <TableCell>
                          {b.selections.map((s, idx) => (
                            <div key={idx}>
                              {consoleName(s.consoleId)} ({s.durationLabel})
                            </div>
                          ))}
                        </TableCell>
                        <TableCell align="right">
                          {b.selections.reduce(
                            (sum, s) => sum + (s.players ?? 0),
                            0,
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {b.confirmed ? (
                            <Tooltip title="Cancel booking">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => toggleConfirmed(b.id, false)}
                                disabled={actionLoading === b.id}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Restore booking">
                              <IconButton
                                color="success"
                                size="small"
                                onClick={() => toggleConfirmed(b.id, true)}
                                disabled={actionLoading === b.id}
                              >
                                <RestoreIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Stack>
          )}
        </Paper>

        <AdminCreateBookingDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={() => load(date)}
          defaultDate={date}
        />
      </Stack>
    </Container>
  );
}
