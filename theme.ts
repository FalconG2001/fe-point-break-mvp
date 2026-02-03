import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#000000", // Pure Black
      light: "#27272a",
      dark: "#000000",
    },
    secondary: {
      main: "#71717a", // Zinc 500
      light: "#a1a1aa",
      dark: "#52525b",
    },
    background: {
      default: "#ffffff", // Pure White
      paper: "#fcfcfc", // Off-White
    },
    text: {
      primary: "#000000",
      secondary: "#52525b",
    },
    divider: "rgba(0, 0, 0, 0.08)",
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily:
      '"Inter", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    h4: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 4,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: "none",
        },
      },
    },
  },
});

export default theme;
