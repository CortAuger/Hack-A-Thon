/**
 * Theme Configuration
 * Defines the global design system for the application using Material-UI.
 * Includes color palette, typography, and component style overrides.
 */

import { createTheme } from "@mui/material/styles";

/**
 * Custom theme configuration
 * Extends Material-UI's default theme
 */
const theme = createTheme({
  // Color palette configuration
  palette: {
    primary: {
      main: "#226a37", // Durham Region Transit green
    },
    secondary: {
      main: "#dc004e", // Accent color for important actions
    },
    background: {
      default: "#f5f5f5", // Light gray background
    },
  },
  // Typography configuration
  typography: {
    fontFamily: "Inter, sans-serif", // Modern, clean font
    h1: {
      fontSize: "2.5rem",
      fontWeight: 600, // Semi-bold
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
    },
  },
  // Component style overrides
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none", // Prevents all-caps button text
        },
      },
    },
  },
});

export default theme;
