"use client";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";

import { CONSOLES, type ConsoleId } from "@/lib/config";

type Game = {
  id: string;
  title: string;
  image: string;
  tag?: string;
};

const MOCK_GAMES: Record<ConsoleId, Game[]> = {
  ps5: [
    {
      id: "gta5",
      title: "GTA V",
      image: "https://placehold.co/600x800?text=GTA+V",
      tag: "Open world",
    },
    {
      id: "spiderman2",
      title: "Spider-Man 2",
      image: "https://placehold.co/600x800?text=Spider-Man+2",
      tag: "Action",
    },
    {
      id: "fc24",
      title: "EA FC 24",
      image: "https://placehold.co/600x800?text=FC+24",
      tag: "Sports",
    },
  ],
  "xbox-series-x": [
    {
      id: "forza",
      title: "Forza Horizon",
      image: "https://placehold.co/600x800?text=Forza",
      tag: "Racing",
    },
    {
      id: "halo",
      title: "Halo",
      image: "https://placehold.co/600x800?text=Halo",
      tag: "Shooter",
    },
    {
      id: "minecraft",
      title: "Minecraft",
      image: "https://placehold.co/600x800?text=Minecraft",
      tag: "Co-op",
    },
  ],
  "xbox-one-s": [
    {
      id: "mario",
      title: "Mario Kart",
      image: "https://placehold.co/600x800?text=Mario+Kart",
      tag: "Party",
    },
    {
      id: "zelda",
      title: "Zelda",
      image: "https://placehold.co/600x800?text=Zelda",
      tag: "Adventure",
    },
  ],
  "xbox-360": [
    {
      id: "valorant",
      title: "Valorant",
      image: "https://placehold.co/600x800?text=Valorant",
      tag: "Competitive",
    },
    {
      id: "cs2",
      title: "CS2",
      image: "https://placehold.co/600x800?text=CS2",
      tag: "Shooter",
    },
    {
      id: "dota2",
      title: "Dota 2",
      image: "https://placehold.co/600x800?text=Dota+2",
      tag: "MOBA",
    },
  ],
};

export default function GamesShowcase() {
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
            Mock data for now. Replace later with your real DB.
          </Typography>
        </Stack>

        <Divider />

        <Stack spacing={3}>
          {CONSOLES.map((c) => {
            const games = MOCK_GAMES[c.id] ?? [];
            if (games.length === 0) return null;

            return (
              <Stack key={c.id} spacing={1.5}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="baseline"
                >
                  <Typography fontWeight={900}>{c.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {games.length} titles
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
                  {games.map((g) => (
                    <Card
                      key={g.id}
                      sx={{
                        minWidth: 160,
                        borderRadius: 2,
                        border: "1px solid rgba(0,0,0,0.08)",
                        boxShadow: "none",
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="170"
                        image={g.image}
                        alt={g.title}
                        style={{ objectFit: "cover" }}
                      />
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography fontWeight={900} variant="body2" noWrap>
                          {g.title}
                        </Typography>
                        {g.tag && (
                          <Chip
                            label={g.tag}
                            size="small"
                            sx={{
                              mt: 1,
                              borderRadius: 1,
                              fontWeight: 900,
                              background: "rgba(0,0,0,0.05)",
                            }}
                          />
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
