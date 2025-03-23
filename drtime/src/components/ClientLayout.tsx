/**
 * Client Layout Component
 * Provides the base layout structure for the application.
 * Wraps the application with theme provider and navigation.
 *
 * Features:
 * - Material-UI theme integration
 * - Global styles with CssBaseline
 * - Navigation bar
 * - Consistent layout structure
 */

"use client";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Navigation from "@/components/Navigation";
import theme from "@/theme"; // Import the global theme

/**
 * ClientLayout Component
 * Wraps the application with necessary providers and layout structure
 * @param children - Child components to be rendered within the layout
 */
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
