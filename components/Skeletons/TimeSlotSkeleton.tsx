"use client";

import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

type Props = {
  count?: number;
};

export default function TimeSlotSkeleton({ count = 12 }: Props) {
  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle1" fontWeight={900}>
          Slots
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tap a slot. We jump to consoles.
        </Typography>
      </Stack>
      <Grid container spacing={1.5}>
        {Array.from({ length: count }).map((_, i) => (
          <Grid key={i} size={{ xs: 6, sm: 4, md: 3 }}>
            <Skeleton variant="rounded" height={72} />
          </Grid>
        ))}
      </Grid>
      <Divider />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.secondary">
          <Skeleton variant="text" width={100} height={32} />
        </Typography>
      </Stack>
    </Stack>
  );
}
