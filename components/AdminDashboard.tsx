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
  IconButton,
  Tooltip,
  Grid,
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
      console.log(json);

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
    <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 8 } }}>
      <Stack spacing={4}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Stack spacing={0.5}>
            <Typography variant="h4" fontWeight={900} color="text.primary">
              Admin Terminal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Managing session cycles.
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                borderRadius: 1,
                px: 3,
                background: "#000",
                color: "#fff",
                "&:hover": { background: "#222" },
              }}
            >
              New Booking
            </Button>
            <Button
              variant="outlined"
              onClick={() => signOut()}
              sx={{
                borderRadius: 1,
                color: "text.primary",
                borderColor: "rgba(0,0,0,0.2)",
              }}
            >
              Exit
            </Button>
          </Stack>
        </Stack>

        <DateTabs value={date} onChange={setDate} />

        {!loading && data && !data.error && (
          <Grid container spacing={2}>
            {[
              { label: "Active", value: data.totalBookings, color: "#000" },
              {
                label: "Consoles",
                value: data.totalConsolesBooked,
                color: "#71717a",
              },
              { label: "Players", value: data.totalPlayers, color: "#a1a1aa" },
            ].map((stat, i) => (
              <Grid key={i} size={{ xs: 12, sm: 4 }}>
                <Paper
                  sx={{
                    p: 2.5,
                    borderRadius: 1,
                    background: "#ffffff",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    borderLeft: `2px solid ${stat.color}`,
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", fontSize: "0.65rem" }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5 }}>
                    {stat.value}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        <Paper
          className="glass-panel"
          elevation={0}
          sx={{
            p: { xs: 0, sm: 1 },
            borderRadius: 1,
            background: "rgba(255, 255, 255, 0.5)",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            overflowX: "auto",
          }}
        >
          {loading && (
            <Stack sx={{ p: 8, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Accessing mainframe...
              </Typography>
            </Stack>
          )}

          {!loading && data?.error && (
            <Alert severity="error" sx={{ m: 3, borderRadius: 1 }}>
              {data.error}
            </Alert>
          )}

          {!loading && data && !data.error && (
            <Stack spacing={0}>
              {data.bookings.length === 0 ? (
                <Stack sx={{ p: 8, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    No bookings detected.
                  </Typography>
                </Stack>
              ) : (
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow sx={{ background: "rgba(0, 0, 0, 0.02)" }}>
                      <TableCell
                        sx={{
                          fontWeight: 800,
                          color: "text.secondary",
                          fontSize: "0.7rem",
                          letterSpacing: "0.05em",
                        }}
                      >
                        STATUS
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 800,
                          color: "text.secondary",
                          fontSize: "0.7rem",
                          letterSpacing: "0.05em",
                        }}
                      >
                        SRC
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 800,
                          color: "text.secondary",
                          fontSize: "0.7rem",
                          letterSpacing: "0.05em",
                        }}
                      >
                        TIME
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 800,
                          color: "text.secondary",
                          fontSize: "0.7rem",
                          letterSpacing: "0.05em",
                        }}
                      >
                        CUSTOMER
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 800,
                          color: "text.secondary",
                          fontSize: "0.7rem",
                          letterSpacing: "0.05em",
                        }}
                      >
                        CONSOLES
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 800,
                          color: "text.secondary",
                          fontSize: "0.7rem",
                          letterSpacing: "0.05em",
                        }}
                      >
                        PROX
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 800,
                          color: "text.secondary",
                          fontSize: "0.7rem",
                          letterSpacing: "0.05em",
                        }}
                      >
                        ACT
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.bookings.map((b) => (
                      <TableRow
                        key={b.id}
                        sx={{
                          opacity: b.confirmed ? 1 : 0.5,
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.01)",
                          },
                          "& .MuiTableCell-root": {
                            borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
                            py: 1.5,
                          },
                        }}
                      >
                        <TableCell>
                          <Chip
                            size="small"
                            label={b.confirmed ? "LIVE" : "VOID"}
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.6rem",
                              borderRadius: 0.5,
                              backgroundColor: b.confirmed
                                ? "rgba(0, 0, 0, 0.05)"
                                : "transparent",
                              color: b.confirmed ? "#000" : "text.secondary",
                              border: `1px solid ${b.confirmed ? "#000" : "rgba(0,0,0,0.1)"}`,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            sx={{
                              color: "text.secondary",
                              textTransform: "uppercase",
                              fontSize: "0.65rem",
                            }}
                          >
                            {b.bookingFrom || "web"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            sx={{ fontSize: "0.85rem" }}
                          >
                            {b.slot}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              sx={{ fontSize: "0.85rem" }}
                            >
                              {b.customer?.name ?? ""}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: "0.7rem" }}
                            >
                              {b.customer?.phone ?? ""}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {b.selections.map((s, idx) => (
                              <Chip
                                key={idx}
                                label={`${consoleName(s.consoleId)} • ${s.durationLabel}`}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: "0.65rem",
                                  borderRadius: 0.5,
                                  background: "rgba(0,0,0,0.03)",
                                  color: "text.secondary",
                                }}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            sx={{ fontSize: "0.85rem" }}
                          >
                            {b.selections.reduce(
                              (sum, s) => sum + (s.players ?? 0),
                              0,
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {b.confirmed ? (
                            <Tooltip title="Void">
                              <IconButton
                                color="error"
                                onClick={() => toggleConfirmed(b.id, false)}
                                disabled={actionLoading === b.id}
                                sx={{
                                  borderRadius: 0.5,
                                  p: 0.5,
                                  opacity: 0.7,
                                  "&:hover": { opacity: 1 },
                                }}
                              >
                                <CancelIcon sx={{ fontSize: "1.2rem" }} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Restore">
                              <IconButton
                                color="success"
                                onClick={() => toggleConfirmed(b.id, true)}
                                disabled={actionLoading === b.id}
                                sx={{
                                  borderRadius: 0.5,
                                  p: 0.5,
                                  opacity: 0.7,
                                  "&:hover": { opacity: 1 },
                                }}
                              >
                                <RestoreIcon sx={{ fontSize: "1.2rem" }} />
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
