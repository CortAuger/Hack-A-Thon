"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Navigation from "@/components/Navigation";

const theme = createTheme({
  palette: {
    primary: {
      main: "#4CAF50",
    },
    background: {
      default: "#ffffff",
      paper: "#E8F5E9",
    },
  },
});

// ClientLayout component wraps the application with theme and navigation
// This is a client component that provides the basic layout structure
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navigation />
      <main>{children}</main>
    </ThemeProvider>
  );
}
