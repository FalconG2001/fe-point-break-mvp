"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import TvIcon from "@mui/icons-material/Tv";
import { CONSOLES, TV_COUNT, CENTRE_NAME } from "@/lib/config";

const BRAND_COLORS: Record<string, string> = {
  ps5: "#0072ce",
  xbox: "#107c10",
  switch: "#e60012",
  pc: "#6366f1",
};

export default function ConsoleCards() {
  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
      >
        <Stack spacing={0.5}>
          <Typography variant="h5" fontWeight={900} color="text.primary">
            {CENTRE_NAME}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pick a date, pick a slot, pick your consoles. Done.
          </Typography>
        </Stack>
        <Chip
          icon={<TvIcon sx={{ fontSize: "1.2rem !important" }} />}
          label={`${TV_COUNT} Gaming Stations`}
          variant="outlined"
          sx={{ borderRadius: 1, fontWeight: 700 }}
        />
      </Stack>

      <Grid container spacing={2}>
        {CONSOLES.map((c) => (
          <Grid key={c.id} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              className="glass-panel"
              sx={{
                height: "100%",
                background: "#ffffff",
                border: `1px solid rgba(0, 0, 0, 0.08)`,
                borderRadius: 1,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0 8px 16px rgba(0, 0, 0, 0.05)",
                  borderColor: "rgba(0, 0, 0, 0.2)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SportsEsportsIcon
                      sx={{ color: "text.primary", fontSize: "1.1rem" }}
                    />
                    <Typography
                      variant="subtitle2"
                      fontWeight={800}
                      sx={{ letterSpacing: "0.02em" }}
                    >
                      {c.name}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ minHeight: 40, lineHeight: 1.5 }}
                  >
                    {c.notes}
                  </Typography>
                  <Chip
                    size="small"
                    label={c.short}
                    sx={{
                      width: "fit-content",
                      fontWeight: 700,
                      borderRadius: 0.5,
                      backgroundColor: "rgba(0, 0, 0, 0.03)",
                      color: "text.secondary",
                      border: "1px solid rgba(0, 0, 0, 0.05)",
                      fontSize: "0.65rem",
                    }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
