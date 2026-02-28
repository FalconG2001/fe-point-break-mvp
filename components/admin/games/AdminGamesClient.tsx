"use client";

import * as React from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Pagination from "@mui/material/Pagination";

import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import IconButton from "@mui/material/IconButton";

import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Tooltip from "@mui/material/Tooltip";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";

import { useRouter } from "next/navigation";
import useQueryParams from "@/utils/useQueryParams";
import debounce from "lodash/debounce";

type ConsoleDTO = {
  consoleId: string;
  name: string;
  type: "Xbox" | "PlayStation";
  imgSrc?: string;
};

type ConsoleRef = {
  consoleId: string;
  name: string;
  type: "Xbox" | "PlayStation";
};

type GameRow = {
  id: string;
  title: string;
  genre?: string;
  imageUrl?: string;
  shortDesc?: string;
  playableOn: ConsoleRef[];
  installedOn: ConsoleRef[];
  installed: boolean;
};

type InitialData = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: GameRow[];
  consoles: ConsoleDTO[];
};

type ConfirmState = null | {
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
};

export default function AdminGamesClient({
  initialData,
}: {
  initialData: InitialData;
}) {
  const router = useRouter();
  const { setQueryParams, queryParams } = useQueryParams<{
    keyword: string;
    page: number;
  }>();

  const [keyword, setKeyword] = React.useState(
    queryParams?.get("keyword") || "",
  );

  const [toast, setToast] = React.useState<string | null>(null);
  const [errorToast, setErrorToast] = React.useState<string | null>(null);

  const [editOpen, setEditOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [activeGame, setActiveGame] = React.useState<GameRow | null>(null);

  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [menuGame, setMenuGame] = React.useState<GameRow | null>(null);

  const [confirm, setConfirm] = React.useState<ConfirmState>(null);
  const [confirmLoading, setConfirmLoading] = React.useState(false);

  const consoles = initialData.consoles;

  const setQueryParamsRef = React.useRef(setQueryParams);
  React.useEffect(() => {
    setQueryParamsRef.current = setQueryParams;
  }, [setQueryParams]);

  const debouncedSetParams = React.useRef(
    debounce((val: string) => {
      setQueryParamsRef.current({ keyword: val || undefined, page: 1 });
    }, 450),
  ).current;

  React.useEffect(() => {
    debouncedSetParams(keyword);
    return () => debouncedSetParams.cancel();
  }, [keyword, debouncedSetParams]);

  function openMenu(e: React.MouseEvent<HTMLElement>, g: GameRow) {
    setMenuAnchor(e.currentTarget);
    setMenuGame(g);
  }

  function closeMenu() {
    setMenuAnchor(null);
    setMenuGame(null);
  }

  function openEdit(g: GameRow) {
    closeMenu();
    setActiveGame(g);
    setEditOpen(true);
  }

  function changePage(nextPage: number) {
    const q = keyword ? `&keyword=${encodeURIComponent(keyword)}` : "";
    router.push(`/admin/games?page=${nextPage}${q}`);
  }

  async function doDelete(id: string) {
    const res = await fetch(`/api/admin/games/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || "Delete failed");
  }

  async function markUninstalledEverywhere(id: string) {
    const res = await fetch(`/api/admin/games/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ installedConsoleIds: [] }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || "Update failed");
  }

  const startIndex = (initialData.page - 1) * initialData.pageSize;

  return (
    <Stack spacing={2}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 2,
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            spacing={1.5}
          >
            <Stack spacing={0.4}>
              <Typography fontWeight={900} variant="h6">
                Games
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Installed games show first. Then the rest.
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <TextField
                size="small"
                placeholder="Search games..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon
                          sx={{ fontSize: "1.1rem", color: "text.secondary" }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ width: { xs: "100%", sm: 260 } }}
              />

              <Button
                variant="contained"
                onClick={() => {
                  setActiveGame(null);
                  setCreateOpen(true);
                }}
                sx={{ borderRadius: 2, fontWeight: 900, whiteSpace: "nowrap" }}
              >
                Create Game
              </Button>
              <Button
                variant="outlined"
                onClick={() => setBulkOpen(true)}
                sx={{ borderRadius: 2, fontWeight: 900, whiteSpace: "nowrap" }}
              >
                Bulk install
              </Button>
            </Stack>
          </Stack>

          <Divider />

          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: "rgba(0, 0, 0, 0.02)" }}>
                  {[
                    "S.NO",
                    "GAME",
                    "CONSOLE",
                    "IMAGE",
                    "INSTALLED",
                    "ACTION",
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
                </TableRow>
              </TableHead>
              <TableBody>
                {initialData.items.map((g, idx) => (
                  <TableRow key={g.id} hover>
                    <TableCell sx={{ fontWeight: 800 }}>
                      {startIndex + idx + 1}
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.3}>
                        <Typography fontWeight={900}>{g.title}</Typography>
                        {g.genre ? (
                          <Typography variant="caption" color="text.secondary">
                            {g.genre}
                          </Typography>
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {g.installedOn?.length ? (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {g.installedOn.map((c) => (
                            <Chip
                              key={c.consoleId}
                              label={c.name}
                              size="small"
                              sx={{ borderRadius: 1, fontWeight: 800 }}
                            />
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Avatar
                        variant="rounded"
                        src={g.imageUrl || ""}
                        alt={g.title}
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 1,
                          border: "1px solid rgba(0,0,0,0.08)",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={g.installed ? "Yes" : "No"}
                        size="small"
                        sx={{
                          borderRadius: 1,
                          fontWeight: 900,
                          background: g.installed
                            ? "rgba(16,185,129,0.12)"
                            : "rgba(0,0,0,0.06)",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={(e) => openMenu(e, g)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Stack direction="row" justifyContent="flex-end">
            <Pagination
              count={initialData.totalPages}
              page={initialData.page}
              onChange={(_, p) => changePage(p)}
            />
          </Stack>
        </Stack>
      </Paper>

      {/* Actions menu */}
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        <MenuItem onClick={() => (menuGame ? openEdit(menuGame) : null)}>
          <EditIcon sx={{ mr: 1, fontSize: "1.1rem" }} />
          Edit
        </MenuItem>

        {menuGame?.installed && (
          <MenuItem
            onClick={() => {
              if (!menuGame) return;
              closeMenu();
              setConfirm({
                title: "Mark uninstalled?",
                message: `This will remove "${menuGame.title}" from all installed consoles.`,
                confirmText: "Mark uninstalled",
                danger: true,
                onConfirm: async () => {
                  await markUninstalledEverywhere(menuGame.id);
                  setToast("Marked uninstalled");
                  router.refresh();
                },
              });
            }}
          >
            <BlockIcon sx={{ mr: 1, fontSize: "1.1rem" }} />
            Mark uninstalled
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            if (!menuGame) return;
            closeMenu();
            setConfirm({
              title: "Delete game?",
              message: `This will permanently delete "${menuGame.title}".`,
              confirmText: "Delete",
              danger: true,
              onConfirm: async () => {
                await doDelete(menuGame.id);
                setToast("Deleted");
                router.refresh();
              },
            });
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: "1.1rem" }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create / Edit dialog */}
      <GameDialog
        open={createOpen || editOpen}
        isEdit={editOpen}
        consoles={consoles}
        game={activeGame}
        onClose={() => {
          setCreateOpen(false);
          setEditOpen(false);
          setActiveGame(null);
        }}
        onConfirmSave={(payload: {
          title: string;
          imageUrl: string;
          genre: string;
          shortDesc: string;
          installedConsoleIds: string[];
        }) => {
          if (createOpen) {
            setConfirm({
              title: "Create new game?",
              message: `Add "${payload.title}" to the database?`,
              confirmText: "Create",
              onConfirm: async () => {
                const res = await fetch(`/api/admin/games`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(json?.error || "Creation failed");

                setToast("Created successfully");
                router.refresh();
              },
            });
          } else if (editOpen && activeGame) {
            setConfirm({
              title: "Save changes?",
              message: `Update "${activeGame.title}" with these edits?`,
              confirmText: "Save",
              onConfirm: async () => {
                const res = await fetch(`/api/admin/games/${activeGame.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(json?.error || "Save failed");

                setToast("Saved");
                router.refresh();
              },
            });
          }

          setCreateOpen(false);
          setEditOpen(false);
          setActiveGame(null);
        }}
      />

      {/* Bulk install */}
      <BulkInstallDialog
        open={bulkOpen}
        consoles={consoles}
        onClose={() => setBulkOpen(false)}
        onRequestConfirm={(payload) => {
          setConfirm({
            title: "Confirm bulk install?",
            message: `Install ${payload.identifiers.length} game(s) on "${payload.consoleId}"?`,
            confirmText: "Install",
            onConfirm: async () => {
              const res = await fetch("/api/admin/games/bulk-install", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });

              const json = await res.json().catch(() => ({}));
              if (!res.ok)
                throw new Error(json?.error || "Bulk install failed");

              setToast(
                `Updated: ${json.updated ?? 0} • Missing: ${json.missing?.length ?? 0}`,
              );
              router.refresh();
            },
          });

          setBulkOpen(false);
        }}
        onError={(msg) => setErrorToast(msg)}
      />

      {/* Confirm dialog (used for all actions) */}
      <ConfirmDialog
        open={!!confirm}
        loading={confirmLoading}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        confirmText={confirm?.confirmText || "Confirm"}
        danger={!!confirm?.danger}
        onClose={() => {
          if (confirmLoading) return;
          setConfirm(null);
        }}
        onConfirm={async () => {
          if (!confirm) return;
          setConfirmLoading(true);
          try {
            await confirm.onConfirm();
            setConfirm(null);
          } catch (e: any) {
            setErrorToast(e?.message || "Action failed");
            setConfirm(null);
          } finally {
            setConfirmLoading(false);
          }
        }}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast(null)}
        message={toast ?? ""}
      />

      <Snackbar
        open={!!errorToast}
        autoHideDuration={3500}
        onClose={() => setErrorToast(null)}
      >
        <Alert severity="error" onClose={() => setErrorToast(null)}>
          {errorToast ?? ""}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

/** Unified Dialog for Create and Edit. Parent handles the actual API + confirmation logic. */
function GameDialog({
  open,
  isEdit,
  onClose,
  onConfirmSave,
  game,
  consoles,
}: {
  open: boolean;
  isEdit: boolean;
  onClose: () => void;
  onConfirmSave: (payload: {
    title: string;
    imageUrl: string;
    genre: string;
    shortDesc: string;
    installedConsoleIds: string[];
  }) => void;
  game: GameRow | null;
  consoles: ConsoleDTO[];
}) {
  const [title, setTitle] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [genre, setGenre] = React.useState("");
  const [shortDesc, setShortDesc] = React.useState("");
  const [installedConsoleIds, setInstalledConsoleIds] = React.useState<
    string[]
  >([]);

  React.useEffect(() => {
    if (!open) return;
    if (isEdit && game) {
      setTitle(game.title ?? "");
      setImageUrl(game.imageUrl ?? "");
      setGenre(game.genre ?? "");
      setShortDesc(game.shortDesc ?? "");
      setInstalledConsoleIds((game.installedOn ?? []).map((c) => c.consoleId));
    } else {
      // Create mode - reset
      setTitle("");
      setImageUrl("");
      setGenre("");
      setShortDesc("");
      setInstalledConsoleIds([]);
    }
  }, [open, isEdit, game]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>
        {isEdit ? "Edit game" : "Create new game"}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2.2} sx={{ mt: 1 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            placeholder="e.g. Forza Horizon 5"
          />
          <TextField
            label="Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            fullWidth
            placeholder="https://..."
          />
          <TextField
            label="Genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            fullWidth
            placeholder="e.g. Racing"
          />
          <TextField
            label="Short description"
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            placeholder="Briefly describe the game..."
          />

          <FormControl fullWidth>
            <InputLabel>Installed on</InputLabel>
            <Select
              label="Installed on"
              multiple
              value={installedConsoleIds}
              onChange={(e) =>
                setInstalledConsoleIds(e.target.value as string[])
              }
              renderValue={(selected) =>
                consoles
                  .filter((c) => selected.includes(c.consoleId))
                  .map((c) => c.name)
                  .join(", ")
              }
            >
              {consoles.map((c) => (
                <MenuItem key={c.consoleId} value={c.consoleId}>
                  <Checkbox
                    checked={installedConsoleIds.includes(c.consoleId)}
                  />
                  <ListItemText primary={c.name} secondary={c.consoleId} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() =>
            onConfirmSave({
              title,
              imageUrl,
              genre,
              shortDesc,
              installedConsoleIds,
            })
          }
          disabled={title.trim().length < 1}
          sx={{
            borderRadius: 2,
            background: "#000",
            "&:hover": { background: "#222" },
          }}
        >
          {isEdit ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BulkInstallDialog({
  open,
  onClose,
  onRequestConfirm,
  onError,
  consoles,
}: {
  open: boolean;
  onClose: () => void;
  onRequestConfirm: (payload: {
    consoleId: string;
    identifiers: string[];
  }) => void;
  onError: (msg: string) => void;
  consoles: ConsoleDTO[];
}) {
  const [consoleId, setConsoleId] = React.useState("");
  const [text, setText] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setConsoleId("");
      setText("");
    }
  }, [open]);

  function submit() {
    const identifiers = text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!consoleId) return onError("Pick a console");
    if (identifiers.length === 0) return onError("Paste game titles or ids");

    onRequestConfirm({ consoleId, identifiers });
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>Bulk install</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Console</InputLabel>
            <Select
              label="Console"
              value={consoleId}
              onChange={(e) => setConsoleId(e.target.value)}
            >
              {consoles.map((c) => (
                <MenuItem key={c.consoleId} value={c.consoleId}>
                  {c.name} ({c.consoleId})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Game titles or Mongo ids (one per line)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            fullWidth
            multiline
            minRows={8}
            placeholder={`Example:\nForza Horizon 5\n6863ccc744ae8252b17d8076`}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          sx={{
            borderRadius: 2,
            background: "#000",
            "&:hover": { background: "#222" },
          }}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  danger,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  danger: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ fontWeight: 900 }}>{title}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          sx={{
            borderRadius: 2,
            background: danger ? "#b91c1c" : "#000",
            "&:hover": { background: danger ? "#991b1b" : "#222" },
          }}
        >
          {loading ? "Working..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
