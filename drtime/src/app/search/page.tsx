"use client";

import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
} from "@mui/material";
import { GoogleMap, DirectionsRenderer, Marker } from "@react-google-maps/api";

// Interface for location coordinates
interface Location {
  lat: number;
  lng: number;
}

// Interface for directions response
interface DirectionsResponse {
  routes: google.maps.DirectionsRoute[];
  status: google.maps.DirectionsStatus;
}

export default function SearchPage() {
  // State for origin and destination inputs
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  // State for map and directions
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResponse, setDirectionsResponse] =
    useState<google.maps.DirectionsResult | null>(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Durham region center coordinates
  const center = { lat: 43.8971, lng: -78.8658 };

  // Calculate route using Google Maps Directions Service
  const calculateRoute = async () => {
    if (!origin || !destination) {
      setError("Please enter both origin and destination");
      return;
    }

    setIsLoading(true);
    setError(null);

    const directionsService = new google.maps.DirectionsService();

    try {
      const result = await directionsService.route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.TRANSIT,
      });

      setDirectionsResponse(result);
      setError(null);
    } catch (error) {
      setError("Could not calculate route. Please check your inputs.");
      setDirectionsResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear route and inputs
  const clearRoute = () => {
    setDirectionsResponse(null);
    setOrigin("");
    setDestination("");
    setError(null);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Find Your Route
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  label="Origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  fullWidth
                />
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={calculateRoute}
                    disabled={isLoading}
                    fullWidth
                  >
                    {isLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Calculate Route"
                    )}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={clearRoute}
                    disabled={isLoading}
                  >
                    Clear
                  </Button>
                </Box>
                {error && (
                  <Typography color="error" variant="body2">
                    {error}
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: "60vh" }}>
              <GoogleMap
                center={center}
                zoom={12}
                mapContainerStyle={{ width: "100%", height: "100%" }}
                options={{
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: true,
                  fullscreenControl: true,
                }}
                onLoad={(map) => setMap(map)}
              >
                {directionsResponse && (
                  <DirectionsRenderer directions={directionsResponse} />
                )}
              </GoogleMap>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
