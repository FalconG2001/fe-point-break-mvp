"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Grid from "@mui/material/Grid";
import CancelIcon from "@mui/icons-material/Cancel";
import RestoreIcon from "@mui/icons-material/Restore";
import EditIcon from "@mui/icons-material/Edit";
import { todayYmd } from "@/lib/config";
import DateTabs from "./DateTabs";
import AdminCreateBookingDialog from "./AdminCreateBookingDialog";
import { AdminBooking, ApiResp, consoleName } from "@/lib/types";
import { useAdmin } from "./AdminContext";

interface AdminDashboardProps {
  initialData?: ApiResp;
}

export default function AdminDashboard({ initialData }: AdminDashboardProps) {
  const [date, setDate] = React.useState(initialData?.date || todayYmd(0));
  const [data, setData] = React.useState<ApiResp | null>(initialData || null);
  const [loading, setLoading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const { isCreateBookingOpen, setCreateBookingOpen, refreshTrigger } =
    useAdmin();
  const [editingBooking, setEditingBooking] =
    React.useState<AdminBooking | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = React.useState(false);
  const [bookingToCancel, setBookingToCancel] = React.useState<string | null>(
    null,
  );
  const [restoreConfirmOpen, setRestoreConfirmOpen] = React.useState(false);
  const [bookingToRestore, setBookingToRestore] = React.useState<string | null>(
    null,
  );

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
        grandTotalPaid: 0,
        grandTotalDue: 0,
        lastSlotEnding: "",
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
      await load(date);
    } catch (e: any) {
      alert(e?.message || "Failed to update");
    } finally {
      setActionLoading(null);
    }
  }

  const isInitialMount = React.useRef(true);

  React.useEffect(() => {
    if (isInitialMount.current && initialData && date === initialData.date) {
      isInitialMount.current = false;
      return;
    }
    load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, refreshTrigger]);

  return (
    <Stack spacing={4}>
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
            {
              label: "Last Slot",
              value: data.lastSlotEnding || "—",
              color: "#f43f5e",
            },
            {
              label: "Paid",
              value: `₹${data.grandTotalPaid}`,
              color: "#10b981",
            },
            {
              label: "Due",
              value: `₹${data.grandTotalDue}`,
              color: "#f59e0b",
            },
          ].map((stat, i) => (
            <Grid key={i} size={{ xs: 6, sm: 4, md: 2 }}>
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
                    {[
                      "STATUS",
                      "SRC",
                      "START",
                      "END",
                      "CUSTOMER",
                      "CONSOLES",
                    ].map((h) => (
                      <TableCell
                        key={h}
                        sx={{
                          fontWeight: 800,
                          color: "text.secondary",
                          fontSize: "0.7rem",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
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
                      align="right"
                      sx={{
                        fontWeight: 800,
                        color: "text.secondary",
                        fontSize: "0.7rem",
                        letterSpacing: "0.05em",
                      }}
                    >
                      PAID / TOTAL
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
                      DUE
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
                          label={b.confirmed ? "Confirmed" : "Cancelled"}
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
                        <Typography
                          variant="body2"
                          fontWeight={800}
                          sx={{
                            fontSize: "0.85rem",
                            color: "text.secondary",
                          }}
                        >
                          {b.selections[0]?.endTime || b.slot}
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
                      <TableCell align="right">
                        <Stack alignItems="flex-end">
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            sx={{ fontSize: "0.85rem" }}
                          >
                            ₹
                            {b.payments?.reduce(
                              (sum, p) => sum + p.amount,
                              0,
                            ) || 0}{" "}
                            / ₹{b.totalPrice || 0}
                          </Typography>
                          {b.payments && b.payments.length > 0 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: "0.6rem" }}
                            >
                              {b.payments
                                .map((p) =>
                                  p.type === 1
                                    ? `G:${p.amount}`
                                    : `C:${p.amount}`,
                                )
                                .join(", ")}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={800}
                          sx={{
                            fontSize: "0.85rem",
                            color:
                              (b.totalPrice || 0) -
                                (b.payments?.reduce(
                                  (sum, p) => sum + p.amount,
                                  0,
                                ) || 0) >
                              0
                                ? "#f59e0b"
                                : "text.secondary",
                          }}
                        >
                          ₹
                          {Math.max(
                            0,
                            (b.totalPrice || 0) -
                              (b.payments?.reduce(
                                (sum, p) => sum + p.amount,
                                0,
                              ) || 0),
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack
                          direction="row"
                          spacing={0.5}
                          justifyContent="center"
                        >
                          {b.confirmed ? (
                            <Tooltip title="Void">
                              <IconButton
                                color="error"
                                onClick={() => {
                                  setBookingToCancel(b.id);
                                  setCancelConfirmOpen(true);
                                }}
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
                                onClick={() => {
                                  setBookingToRestore(b.id);
                                  setRestoreConfirmOpen(true);
                                }}
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
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() => {
                                setEditingBooking(b);
                                setCreateBookingOpen(true);
                              }}
                              disabled={actionLoading === b.id}
                              sx={{
                                borderRadius: 0.5,
                                p: 0.5,
                                opacity: 0.7,
                                "&:hover": { opacity: 1 },
                              }}
                            >
                              <EditIcon sx={{ fontSize: "1.2rem" }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
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
        open={isCreateBookingOpen}
        onClose={() => {
          setCreateBookingOpen(false);
          setEditingBooking(null);
        }}
        onSuccess={() => {
          load(date);
        }}
        defaultDate={date}
        initialData={editingBooking || undefined}
      />

      <Dialog
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        PaperProps={{
          sx: { borderRadius: 1, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Confirm Cancellation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to void this booking? This action can be
            undone later by restoring the booking.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setCancelConfirmOpen(false)}
            sx={{ color: "text.secondary", fontWeight: 700 }}
          >
            No, Keep it
          </Button>
          <Button
            onClick={() => {
              if (bookingToCancel) {
                toggleConfirmed(bookingToCancel, false);
              }
              setCancelConfirmOpen(false);
              setBookingToCancel(null);
            }}
            variant="contained"
            color="error"
            sx={{ borderRadius: 1, fontWeight: 700, px: 3 }}
          >
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={restoreConfirmOpen}
        onClose={() => setRestoreConfirmOpen(false)}
        PaperProps={{
          sx: { borderRadius: 1, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Confirm Restore</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to restore this booking? It will be marked as
            confirmed again.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setRestoreConfirmOpen(false)}
            sx={{ color: "text.secondary", fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (bookingToRestore) {
                toggleConfirmed(bookingToRestore, true);
              }
              setRestoreConfirmOpen(false);
              setBookingToRestore(null);
            }}
            variant="contained"
            color="success"
            sx={{ borderRadius: 1, fontWeight: 700, px: 3 }}
          >
            Yes, Restore
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
