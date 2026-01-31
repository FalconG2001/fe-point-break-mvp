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
} from "@mui/material";
import { signOut } from "next-auth/react";
import DateTabs from "./DateTabs";
import { todayYmd, CONSOLES } from "@/lib/config";

type AdminBooking = {
  id: string;
  date: string;
  slot: string;
  selections: Array<{ consoleId: string; players: number }>;
  customer: { name: string; phone: string };
  createdAt: string;
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

  React.useEffect(() => {
    load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const consoleName = (id: string) =>
    CONSOLES.find((c) => c.id === id)?.short ?? id;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h5" fontWeight={900}>
            Admin dashboard
          </Typography>
          <Button
            variant="outlined"
            onClick={() => signOut()}
            sx={{ borderRadius: 3 }}
          >
            Sign out
          </Button>
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
                <Chip label={`Bookings: ${data.totalBookings}`} />
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
                      <TableCell>Time</TableCell>
                      <TableCell>Booked by</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Consoles</TableCell>
                      <TableCell align="right">Players</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.bookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.slot}</TableCell>
                        <TableCell>{b.customer?.name ?? ""}</TableCell>
                        <TableCell>{b.customer?.phone ?? ""}</TableCell>
                        <TableCell>
                          {b.selections
                            .map((s) => `${consoleName(s.consoleId)}`)
                            .join(", ")}
                        </TableCell>
                        <TableCell align="right">
                          {b.selections.reduce(
                            (sum, s) => sum + (s.players ?? 0),
                            0,
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
      </Stack>
    </Container>
  );
}
