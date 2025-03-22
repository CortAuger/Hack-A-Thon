"use client";

import { useEffect, useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
  useLoadScript,
} from "@react-google-maps/api";
import type { MarkerProps } from "@react-google-maps/api";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Container,
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
    route_name: string;
    arrival_time: number;
    is_realtime: boolean;
    delay: number;
  }[];
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  height: "70vh",
  overflow: "hidden",
}));

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 43.9441313,
  lng: -78.8945272,
};

export default function StopsPage() {
  const [userLocation, setUserLocation] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [nearbyStops, setNearbyStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          fetchNearbyStops(location);
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Unable to get location information");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
    }
  }, []);

  const fetchNearbyStops = async (location: google.maps.LatLngLiteral) => {
    try {
      const response = await fetch(
        `/api/stops/nearby?lat=${location.lat}&lon=${location.lng}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch nearby stops");
      }
      const data = await response.json();
      setNearbyStops(data.stops);
    } catch (error) {
      console.error("Error fetching nearby stops:", error);
      setError("Unable to fetch nearby bus stops");
    } finally {
      setLoading(false);
    }
  };

  const formatArrivalTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const markerIcon: MarkerProps["icon"] = {
    url: "/bus-stop.svg",
    scaledSize: { width: 30, height: 30 } as google.maps.Size,
  };

  const userMarkerIcon: MarkerProps["icon"] = {
    url: "/user-location.svg",
    scaledSize: { width: 30, height: 30 } as google.maps.Size,
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="calc(100vh - 64px)"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box p={3}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Find Nearby Bus Stops
      </Typography>
      <Box display="flex" gap={3}>
        <StyledPaper sx={{ flex: 2 }}>
          <GoogleMapsProvider>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={userLocation || defaultCenter}
              zoom={15}
            >
              {userLocation && (
                <Marker position={userLocation} icon={userMarkerIcon} />
              )}
              {nearbyStops.map((stop) => (
                <Marker
                  key={stop.stop_id}
                  position={{ lat: stop.stop_lat, lng: stop.stop_lon }}
                  onClick={() => setSelectedStop(stop)}
                  icon={markerIcon}
                />
              ))}
            </GoogleMap>
          </GoogleMapsProvider>
        </StyledPaper>
        <Paper sx={{ flex: 1, overflow: "auto" }}>
          <List>
            {nearbyStops.map((stop) => (
              <ListItem
                key={stop.stop_id}
                button
                selected={selectedStop?.stop_id === stop.stop_id}
                onClick={() => setSelectedStop(stop)}
              >
                <ListItemText
                  primary={stop.stop_name}
                  secondary={`Distance: ${stop.distance.toFixed(2)}km`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
      {selectedStop && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {selectedStop.stop_name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Distance: {selectedStop.distance.toFixed(2)}km
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Upcoming Buses
          </Typography>
          <List>
            {selectedStop.arrivals.map((arrival, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={arrival.route_name}
                  secondary={`Arrival: ${formatArrivalTime(
                    arrival.arrival_time
                  )}${arrival.is_realtime ? " (Real-time)" : ""}${
                    arrival.delay > 0 ? ` (Delay: ${arrival.delay}s)` : ""
                  }`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
}
