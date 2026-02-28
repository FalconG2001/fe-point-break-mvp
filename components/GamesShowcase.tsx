"use client";

import * as React from "react";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";

import { CONSOLES } from "@/lib/config";

type Game = {
  id: string;
  title: string;
  image: string;
  tag?: string;
};

type GameWithConsoles = Game & {
  installedOn: string[];
};

export default function GamesShowcase({
  games = [],
}: {
  games?: GameWithConsoles[];
}) {
  const gamesByConsole = React.useMemo(() => {
    const map: Record<string, GameWithConsoles[]> = {};
    for (const g of games) {
      for (const cidRaw of g.installedOn || []) {
        // Normalize: DB might have underscores, config has hyphens
        const cid = cidRaw.replace(/_/g, "-");
        if (!map[cid]) map[cid] = [];
        map[cid].push(g);
      }
    }
    return map;
  }, [games]);

  const hasAnyGames = games.length > 0;

  if (!hasAnyGames) {
    return null;
  }
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 4 },
        borderRadius: 2,
        border: "1px solid rgba(0,0,0,0.08)",
        background: "#fff",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h6" fontWeight={900}>
            Games installed
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check out the titles we have for you.
          </Typography>
        </Stack>

        <Divider />

        <Stack spacing={3}>
          {CONSOLES.map((c) => {
            const gamesForConsole = gamesByConsole[c.id] ?? [];
            if (gamesForConsole.length === 0) return null;

            return (
              <Stack key={c.id} spacing={1.5}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="baseline"
                >
                  <Typography fontWeight={900}>{c.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {gamesForConsole.length} titles
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    overflowX: "auto",
                    pb: 1,
                    "&::-webkit-scrollbar": { height: 8 },
                    "&::-webkit-scrollbar-thumb": {
                      background: "rgba(0,0,0,0.15)",
                      borderRadius: 10,
                    },
                  }}
                >
                  {gamesForConsole.map((g) => (
                    <Card
                      key={g.id}
                      sx={{
                        width: 140,
                        flexShrink: 0,
                        borderRadius: 2,
                        border: "1px solid rgba(0,0,0,0.06)",
                        boxShadow: "none",
                        transition: "transform 0.2s",
                        "&:hover": { transform: "translateY(-4px)" },
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={g.image}
                        alt={g.title}
                        sx={{
                          height: 180,
                          objectFit: "cover",
                          background: "rgba(0,0,0,0.03)",
                        }}
                      />
                      <CardContent sx={{ p: 1.2, pb: "12px !important" }}>
                        <Typography
                          fontWeight={900}
                          variant="caption"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            lineHeight: 1.3,
                            height: "2.6em",
                          }}
                        >
                          {g.title}
                        </Typography>
                        {g.tag && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              mt: 0.5,
                              display: "block",
                            }}
                          >
                            {g.tag}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    </Paper>
  );
}
