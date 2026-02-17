"use client";

import * as React from "react";
import {
  Stack,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  TextField,
  TablePagination,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import SearchIcon from "@mui/icons-material/Search";
import CancelIcon from "@mui/icons-material/Cancel";
import RestoreIcon from "@mui/icons-material/Restore";
import EditIcon from "@mui/icons-material/Edit";
import { todayYmd } from "@/lib/config";
import { AdminBooking, ApiResp, consoleName } from "@/lib/types";
import AdminCreateBookingDialog from "./AdminCreateBookingDialog";
import { useAdmin } from "./AdminContext";

interface AllBookingsProps {
  onSuccess?: () => void;
}

export default function AllBookings({ onSuccess }: AllBookingsProps) {
  const { isCreateBookingOpen, setCreateBookingOpen, refreshTrigger } =
    useAdmin();
  const [rangeStart, setRangeStart] = React.useState<Dayjs | null>(null);
  const [rangeEnd, setRangeEnd] = React.useState<Dayjs | null>(null);
  const [searchName, setSearchName] = React.useState("");
  const [data, setData] = React.useState<ApiResp | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

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

  async function load() {
    const sYmd = rangeStart?.format("YYYY-MM-DD");
    const eYmd = rangeEnd?.format("YYYY-MM-DD");

    // Exclusion rule: today, tomorrow, dayAfter
    const t0 = todayYmd(0);
    const t1 = todayYmd(1);
    const t2 = todayYmd(2);
    const allowedSet = [t0, t1, t2];

    const isStartAllowed = sYmd && allowedSet.includes(sYmd);
    const isEndAllowed = eYmd && allowedSet.includes(eYmd);

    if (sYmd && eYmd && isStartAllowed && isEndAllowed) {
      setData({
        date: `${sYmd} to ${eYmd}`,
        totalBookings: 0,
        totalConsolesBooked: 0,
        totalPlayers: 0,
        grandTotalPaid: 0,
        grandTotalDue: 0,
        lastSlotEnding: "",
        bookings: [],
      });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
      });
      if (sYmd) params.append("startDate", sYmd);
      if (eYmd) params.append("endDate", eYmd);
      if (searchName) params.append("searchName", searchName);

      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setData(json);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, [rangeStart, rangeEnd, searchName, page, rowsPerPage, refreshTrigger]);

  async function toggleConfirmed(bookingId: string, newConfirmed: boolean) {
    setActionLoading(bookingId);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, confirmed: newConfirmed }),
      });
      if (!res.ok) throw new Error("Update failed");
      await load();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <Box>
      <Stack spacing={4}>
        <Stack spacing={1}>
          <Typography variant="h5" fontWeight={900}>
            Booking Archive & Search
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search through all historical and future session records.
          </Typography>
        </Stack>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search by customer name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <SearchIcon
                        sx={{
                          color: "text.secondary",
                          mr: 1,
                          fontSize: "1.1rem",
                        }}
                      />
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <DatePicker
                label="Start Date"
                value={rangeStart}
                onChange={(newValue) => setRangeStart(newValue)}
                slotProps={{
                  textField: { size: "small", fullWidth: true },
                  field: { clearable: true },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <DatePicker
                label="End Date"
                value={rangeEnd}
                onChange={(newValue) => setRangeEnd(newValue)}
                slotProps={{
                  textField: { size: "small", fullWidth: true },
                  field: { clearable: true },
                }}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>

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
          {loading ? (
            <Stack sx={{ p: 8, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Retrieving data...
              </Typography>
            </Stack>
          ) : !data || data.bookings.length === 0 ? (
            <Stack sx={{ p: 8, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No matching records found outside the current cycle.
              </Typography>
            </Stack>
          ) : (
            <>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow sx={{ background: "rgba(0, 0, 0, 0.02)" }}>
                    {[
                      "DATE",
                      "STATUS",
                      "SRC",
                      "START",
                      "END",
                      "CUSTOMER",
                      "CONSOLES",
                      "PROX",
                      "PAID / TOTAL",
                      "DUE",
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
                      sx={{ opacity: b.confirmed ? 1 : 0.5 }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={800}
                          sx={{ fontSize: "0.85rem" }}
                        >
                          {dayjs(b.date).format("DD MMM")}
                        </Typography>
                      </TableCell>
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
                              label={consoleName(s.consoleId)}
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
                                size="small"
                                color="error"
                                onClick={() => {
                                  setBookingToCancel(b.id);
                                  setCancelConfirmOpen(true);
                                }}
                                disabled={actionLoading === b.id}
                              >
                                <CancelIcon sx={{ fontSize: "1rem" }} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Restore">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => {
                                  setBookingToRestore(b.id);
                                  setRestoreConfirmOpen(true);
                                }}
                                disabled={actionLoading === b.id}
                              >
                                <RestoreIcon sx={{ fontSize: "1rem" }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingBooking(b);
                                setCreateBookingOpen(true);
                              }}
                              disabled={actionLoading === b.id}
                            >
                              <EditIcon sx={{ fontSize: "1rem" }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={(data as any).pagination?.total || 0}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </>
          )}
        </Paper>
      </Stack>

      {/* Dialogs */}
      <AdminCreateBookingDialog
        open={isCreateBookingOpen}
        onClose={() => {
          setCreateBookingOpen(false);
          setEditingBooking(null);
        }}
        onSuccess={() => {
          load();
          if (onSuccess) onSuccess();
        }}
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
    </Box>
  );
}
