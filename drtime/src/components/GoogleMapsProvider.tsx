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
 */

"use client";

import { ReactNode, useState } from "react";
import { LoadScript } from "@react-google-maps/api";
import { CircularProgress, Box, Alert } from "@mui/material";
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
  // State for tracking API loading errors
  const [loadError, setLoadError] = useState<Error | null>(null);

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

  // Display error if API fails to load
  if (loadError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Failed to load Google Maps: {loadError.message}
        </Alert>
      </Box>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
      onError={(error) => {
        console.error("Google Maps API Error:", error);
        setLoadError(error);
      }}
      onLoad={() => {
        console.log("Google Maps API loaded successfully");
      }}
      loadingElement={
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      {children}
    </LoadScript>
  );
}
