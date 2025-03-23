/**
 * Theme Registry Component
 * Manages Material-UI theme and emotion cache setup for the application.
 * Handles server-side rendering (SSR) style injection and client-side theme context.
 *
 * Features:
 * - Material-UI theme provider
 * - Emotion cache management
 * - Server-side style injection
 * - Global style reset (CssBaseline)
 */

"use client";

import createCache from "@emotion/cache";
import { useServerInsertedHTML } from "next/navigation";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/theme";
import { useState } from "react";

/**
 * ThemeRegistry Component
 * Provides theme context and style management for the application
 * @param children - Child components that will receive theme context
 */
export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  /**
   * Initialize emotion cache with a unique key
   * Creates a new cache instance and enables compatibility mode
   */
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({
      key: "mui", // Unique key for MUI styles
    });
    cache.compat = true; // Enable compatibility mode for SSR
    return { cache, flush: cache.insert };
  });

  /**
   * Server-side style injection
   * Collects and injects all emotion styles during SSR
   * Prevents style flickering during hydration
   */
  useServerInsertedHTML(() => {
    const inserted = cache.inserted;
    let styles = "";
    // Collect all inserted styles from the cache
    Object.keys(inserted).forEach((name) => {
      styles += inserted[name];
    });
    // Return style element with collected styles
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${Object.keys(inserted).join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  /**
   * Render theme providers and global styles
   * Wraps children with necessary context providers
   */
  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* Reset browser default styles */}
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
