"use client";

import { useEffect, useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import GoogleMapsProvider from "@/components/GoogleMapsProvider";

interface Stop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  distance: number;
  arrivals: {
    routeId: string;
    routeName: string;
    arrivalTime: number;
    departureTime: number;
    status: string;
  }[];
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(2),
  maxHeight: "80vh",
  overflow: "auto",
}));

const mapContainerStyle = {
  width: "100%",
  height: "70vh",
};

const defaultCenter = {
  lat: 43.9441274,
  lng: -78.8945614,
};

export default function StopsPage() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [userLocation, setUserLocation] =
    useState<google.maps.LatLngLiteral | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          fetchNearbyStops(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          setError("Error getting location: " + error.message);
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
    }
  }, []);

  const fetchNearbyStops = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`/api/stops/nearby?lat=${lat}&lon=${lng}`);
      if (!response.ok) {
        throw new Error("Failed to fetch stops");
      }
      const data = await response.json();
      setStops(data.stops);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stops");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Nearby Bus Stops
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 2 }}>
        <StyledPaper sx={{ flex: 2 }}>
          <GoogleMapsProvider>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={userLocation || defaultCenter}
              zoom={14}
              options={{
                zoomControl: true,
                streetViewControl: true,
                mapTypeControl: true,
                fullscreenControl: true,
              }}
            >
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={{
                    url: "/user-location.png",
                    scaledSize: new google.maps.Size(30, 30),
                  }}
                />
              )}

              {stops.map((stop) => (
                <Marker
                  key={stop.stop_id}
                  position={{ lat: stop.stop_lat, lng: stop.stop_lon }}
                  onClick={() => setSelectedStop(stop)}
                />
              ))}

              {selectedStop && (
                <InfoWindow
                  position={{
                    lat: selectedStop.stop_lat,
                    lng: selectedStop.stop_lon,
                  }}
                  onCloseClick={() => setSelectedStop(null)}
                >
                  <div>
                    <Typography variant="h6">
                      {selectedStop.stop_name}
                    </Typography>
                    <Typography variant="body2">
                      Stop ID: {selectedStop.stop_id}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Next Arrivals:
                    </Typography>
                    {selectedStop.arrivals.map((arrival, index) => (
                      <Typography key={index} variant="body2">
                        {arrival.routeName}:{" "}
                        {new Date(
                          arrival.arrivalTime * 1000
                        ).toLocaleTimeString()}
                      </Typography>
                    ))}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </GoogleMapsProvider>
        </StyledPaper>

        <StyledPaper sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Nearby Stops
          </Typography>
          <List>
            {stops.map((stop) => (
              <ListItem
                key={stop.stop_id}
                component="div"
                onClick={() => setSelectedStop(stop)}
                sx={{ cursor: "pointer" }}
              >
                <ListItemText
                  primary={stop.stop_name}
                  secondary={`${stop.distance.toFixed(2)} km away`}
                />
              </ListItem>
            ))}
          </List>
        </StyledPaper>
      </Box>
    </Box>
  );
}
