"use client";

import { ReactNode } from "react";
import { LoadScript, GoogleMap } from "@react-google-maps/api";
import { CircularProgress, Box } from "@mui/material";
import type { Libraries } from "@googlemaps/js-api-loader";

interface GoogleMapsProviderProps {
  children: ReactNode;
}

const libraries: Libraries = ["places"];

export default function GoogleMapsProvider({
  children,
}: GoogleMapsProviderProps) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    console.error("Google Maps API key is not set");
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
      libraries={libraries}
      onError={(error) => console.error("Google Maps API Error:", error)}
      onLoad={() => console.log("Google Maps API loaded successfully")}
    >
      {children}
    </LoadScript>
  );
}
