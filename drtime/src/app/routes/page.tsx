"use client";

import { useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import GoogleMapsProvider from "@/components/GoogleMapsProvider";

interface Place {
  name: string;
  location: google.maps.LatLngLiteral;
}

interface Route {
  distance: string;
  duration: string;
  steps: google.maps.DirectionsStep[];
}

const mapContainerStyle = {
  width: "100%",
  height: "100vh",
};

const defaultCenter = {
  lat: 43.9441274,
  lng: -78.8945614,
};

export default function RoutesPage() {
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (
    type: "origin" | "destination",
    value: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/places/search?query=${encodeURIComponent(value)}`
      );
      if (!response.ok) {
        throw new Error("Failed to search places");
      }

      const data = await response.json();
      if (data.places && data.places.length > 0) {
        const place = data.places[0];
        if (type === "origin") {
          setOrigin(place);
        } else {
          setDestination(place);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search places");
    } finally {
      setLoading(false);
    }
  };

  const handleGetDirections = async () => {
    if (!origin || !destination) {
      setError("Please select both origin and destination");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin: origin.location,
          destination: destination.location,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get directions");
      }

      const data = await response.json();
      setDirections(data.directions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get directions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleMapsProvider>
      <Box sx={{ height: "100vh", width: "100%", display: "flex" }}>
        <Paper sx={{ p: 2, width: 300, zIndex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Plan Your Trip
          </Typography>

          <TextField
            fullWidth
            label="Origin"
            margin="normal"
            onChange={(e) => handleSearch("origin", e.target.value)}
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Destination"
            margin="normal"
            onChange={(e) => handleSearch("destination", e.target.value)}
            disabled={loading}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handleGetDirections}
            disabled={loading || !origin || !destination}
            sx={{ mt: 2 }}
          >
            Get Directions
          </Button>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {loading && (
            <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
              <CircularProgress />
            </Box>
          )}

          {directions && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">
                Distance: {directions.routes[0].legs[0].distance?.text}
              </Typography>
              <Typography variant="subtitle1">
                Duration: {directions.routes[0].legs[0].duration?.text}
              </Typography>
            </Box>
          )}
        </Paper>

        <Box sx={{ flex: 1 }}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={14}
            options={{
              zoomControl: true,
              streetViewControl: true,
              mapTypeControl: true,
              fullscreenControl: true,
            }}
          >
            {origin && <Marker position={origin.location} label="A" />}

            {destination && (
              <Marker position={destination.location} label="B" />
            )}

            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: true,
                }}
              />
            )}
          </GoogleMap>
        </Box>
      </Box>
    </GoogleMapsProvider>
  );
}
