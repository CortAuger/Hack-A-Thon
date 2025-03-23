"use client";

import { ReactNode, useState } from "react";
import { LoadScript } from "@react-google-maps/api";
import { CircularProgress, Box, Alert } from "@mui/material";
import type { Libraries } from "@googlemaps/js-api-loader";

interface GoogleMapsProviderProps {
  children: ReactNode;
}

const libraries: Libraries = ["places"];

export default function GoogleMapsProvider({
  children,
}: GoogleMapsProviderProps) {
  const [loadError, setLoadError] = useState<Error | null>(null);

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
