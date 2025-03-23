/**
 * Google Maps Provider Component
 * Provides Google Maps API initialization and loading state management.
 * Wraps Google Maps components with necessary configuration and error handling.
 *
 * Features:
 * - Google Maps API initialization
 * - Loading state management
 * - Error handling
 * - Places library integration
 * - Prevents duplicate API loading issues
 */

"use client";

import { ReactNode, useState, useEffect } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { CircularProgress, Box, Alert, Button } from "@mui/material";
import type { Libraries } from "@googlemaps/js-api-loader";

/**
 * Props interface for GoogleMapsProvider
 * @property children - Child components that will use Google Maps functionality
 */
interface GoogleMapsProviderProps {
  children: ReactNode;
}

/**
 * Google Maps libraries to load
 * Currently includes Places library for location search functionality
 */
const libraries: Libraries = ["places"];

/**
 * GoogleMapsProvider Component
 * Handles the initialization and loading of Google Maps API
 * @param children - Child components that need Google Maps functionality
 */
export default function GoogleMapsProvider({
  children,
}: GoogleMapsProviderProps) {
  const [retryCount, setRetryCount] = useState(0);

  // Check if API key is configured
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Google Maps API key is not set. Please check your environment
          variables.
        </Alert>
      </Box>
    );
  }

  // Use the hook approach instead of LoadScript component
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
    // Force reload when retry is attempted
    id: `drtime-google-maps-instance-${retryCount}`,
    preventGoogleFontsLoading: false,
  });

  // Handle retry when loading fails
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    console.log("Retrying Google Maps API load, attempt:", retryCount + 1);
  };

  // Display error if API fails to load with retry option
  if (loadError) {
    console.error("Google Maps API loading error:", loadError);
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          Failed to load Google Maps: {loadError.message}. Please try refreshing
          the page or retry.
        </Alert>
      </Box>
    );
  }

  // Display loading state
  if (!isLoaded) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Render children only when API is successfully loaded
  return <>{children}</>;
}
