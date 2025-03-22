"use client";

import createCache from "@emotion/cache";
import { useServerInsertedHTML } from "next/navigation";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/theme";
import { useState } from "react";

// ThemeRegistry component handles Material-UI theme and emotion cache setup
// This is a client component that provides theme context to the entire application
export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize emotion cache with a unique key
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({
      key: "mui",
    });
    cache.compat = true;
    return { cache, flush: cache.insert };
  });

  // Insert styles on the server side
  useServerInsertedHTML(() => {
    const inserted = cache.inserted;
    let styles = "";
    // Collect all inserted styles
    Object.keys(inserted).forEach((name) => {
      styles += inserted[name];
    });
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${Object.keys(inserted).join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  // Provide theme and emotion cache context to children
  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
