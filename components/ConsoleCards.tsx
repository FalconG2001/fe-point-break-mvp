"use client";

import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Stack,
} from "@mui/material";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import TvIcon from "@mui/icons-material/Tv";
import { CONSOLES, TV_COUNT, CENTRE_NAME } from "@/lib/config";

export default function ConsoleCards() {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="h5" fontWeight={800}>
          {CENTRE_NAME}
        </Typography>
        <Chip icon={<TvIcon />} label={`${TV_COUNT} TVs`} />
      </Stack>

      <Typography variant="body1" color="text.secondary">
        Pick a date, pick a slot, pick your consoles. Done.
      </Typography>

      <Grid container spacing={2}>
        {CONSOLES.map((c) => (
          <Grid key={c.id} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <SportsEsportsIcon />
                  <Typography fontWeight={700}>{c.name}</Typography>
                </Stack>
                <Chip size="small" label={c.short} sx={{ mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {c.notes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
