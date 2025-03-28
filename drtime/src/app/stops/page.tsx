/**
 * Stops Page
 * Displays nearby bus stops on an interactive Google Map.
 * Shows real-time bus arrival information and allows users to view details
 * for each stop including scheduled arrivals and real-time updates.
 *
 * Features:
 * - Interactive Google Map with bus stop markers
 * - Current location detection
 * - Real-time bus arrival information
 * - Stop details with arrival times
 * - Distance calculation from user location
 */

"use client";

import { useEffect, useState } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
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
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import GoogleMapsProvider from "@/components/GoogleMapsProvider";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

/**
 * Interface for bus arrival information
 * Contains details about scheduled and real-time arrivals
 */
interface Arrival {
  routeId: string;
  routeName: string;
  headsign: string;
  scheduledArrival: string;
  scheduledDeparture: string;
  minutesUntilArrival: number;
  minutesUntilDeparture: number;
  isRealtime: boolean;
  delayMinutes: number;
}

/**
 * Interface for bus stop information
 * Contains location and arrival data for each stop
 */
interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  arrivals: Arrival[];
}

/**
 * Styled component for the map container
 * Provides consistent styling for the Google Maps display
 */
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  height: "70vh",
  overflow: "hidden",
}));

/**
 * Map container style configuration
 */
const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

/**
 * Default center coordinates for the map
 * Centered on Durham Region
 */
const defaultCenter = {
  lat: 43.9441313,
  lng: -78.8945272,
};

/**
 * Google Maps options configuration
 */
const mapOptions: google.maps.MapOptions = {
  zoom: 13,
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true,
};

/**
 * Styled component for the info window content
 * Provides styling for the stop information display
 */
const StyledInfoWindowContent = styled(Box)(({ theme }) => ({
  maxHeight: 300,
  maxWidth: 380,
  padding: theme.spacing(1.5),
  "& .stop-name": {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(1),
  },
  "& .distance": {
    display: "inline-block",
    backgroundColor: theme.palette.grey[100],
    padding: "4px 8px",
    borderRadius: 12,
    fontSize: "0.9rem",
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1.5),
  },
  "& .section-title": {
    fontSize: "1rem",
    fontWeight: 500,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1.5),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
  },
  "& .arrival-item": {
    backgroundColor: theme.palette.background.paper,
    borderRadius: 8,
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    "&:last-child": {
      marginBottom: 0,
    },
  },
  "& .route-info": {
    fontWeight: 500,
    color: theme.palette.text.primary,
    fontSize: "0.95rem",
    marginBottom: theme.spacing(1),
  },
  "& .time-info": {
    color: theme.palette.text.secondary,
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
  },
  "& .arrival-time": {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    padding: "4px 8px",
    borderRadius: 12,
    fontSize: "0.9rem",
    fontWeight: 500,
  },
  "& .minutes-badge": {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
    padding: "3px 8px",
    borderRadius: 12,
    fontSize: "0.85rem",
    fontWeight: 500,
    marginLeft: "auto",
    "&.realtime": {
      backgroundColor: theme.palette.primary.main,
    },
    "&.delayed": {
      backgroundColor: theme.palette.error.main,
    },
  },
}));

/**
 * StopsPage Component
 * Main component for displaying nearby bus stops and their information
 */
export default function StopsPage() {
  // State management for map and stop data
  const [userLocation, setUserLocation] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [nearbyStops, setNearbyStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [markerIcon, setMarkerIcon] = useState<google.maps.Symbol>();
  const [userMarkerIcon, setUserMarkerIcon] = useState<google.maps.Symbol>();

  /**
   * Handles map load event
   * Sets up marker icons and initializes map state
   */
  const onMapLoad = () => {
    setMapLoaded(true);
    setMarkerIcon({
      path: "M17 5H3c-1.1 0-2 .9-2 2v9h2c0 1.65 1.34 3 3 3s3-1.35 3-3h5.5c0 1.65 1.34 3 3 3s3-1.35 3-3H23v-3.5L17 5zM3 11V7h13v4H3zm3.5 6c-.83 0-1.5-.67-1.5-1.5S5.67 14 6.5 14s1.5.67 1.5 1.5S7.33 17 6.5 17zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
      fillColor: "#4CAF50",
      fillOpacity: 1,
      strokeWeight: 1,
      strokeColor: "#388E3C",
      scale: 1.2,
      anchor: new google.maps.Point(12, 12),
    });

    setUserMarkerIcon({
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: "#2196F3",
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "#FFFFFF",
      scale: 8,
      anchor: new google.maps.Point(0, 0),
    });
  };

  /**
   * Fetches user's current location and nearby stops
   * Handles geolocation errors and updates state accordingly
   */
  useEffect(() => {
    let mounted = true;

    const getUserLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!mounted) return;

            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(location);
            fetchNearbyStops(location);
          },
          (error) => {
            if (!mounted) return;

            console.error("Error getting location:", error);
            setError("Unable to get location information");
            setLoading(false);
          }
        );
      } else {
        if (!mounted) return;

        setError("Geolocation is not supported by your browser");
        setLoading(false);
      }
    };

    getUserLocation();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Fetches nearby bus stops from the API
   * @param location User's current location
   */
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

  // Loading state display
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

  // Error state display
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
      <StyledPaper>
        <GoogleMapsProvider>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={userLocation || defaultCenter}
            zoom={15}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
            }}
            onLoad={onMapLoad}
          >
            {/* User Location Marker */}
            {userLocation && userMarkerIcon && (
              <Marker position={userLocation} icon={userMarkerIcon} />
            )}
            {/* Bus Stop Markers */}
            {markerIcon &&
              nearbyStops.map((stop) => (
                <Marker
                  key={stop.id}
                  position={{ lat: stop.latitude, lng: stop.longitude }}
                  onClick={() => setSelectedStop(stop)}
                  icon={markerIcon}
                  title={`${stop.name} (${stop.distance.toFixed(2)}km)`}
                />
              ))}
            {/* Stop Information Window */}
            {selectedStop && (
              <InfoWindow
                position={{
                  lat: selectedStop.latitude,
                  lng: selectedStop.longitude,
                }}
                onCloseClick={() => setSelectedStop(null)}
              >
                <StyledInfoWindowContent>
                  <Typography className="stop-name">
                    {selectedStop.name}
                  </Typography>
                  <Typography component="span" className="distance">
                    {selectedStop.distance.toFixed(2)}km away
                  </Typography>
                  <Typography className="section-title">
                    <DirectionsBusIcon sx={{ fontSize: 18 }} />
                    Upcoming Buses
                  </Typography>
                  {selectedStop.arrivals.length > 0 ? (
                    <Box>
                      {selectedStop.arrivals.map((arrival, index) => (
                        <Box
                          key={`${selectedStop.id}-${arrival.routeId}-${arrival.scheduledArrival}-${index}`}
                          className="arrival-item"
                        >
                          <Typography className="route-info">
                            Route {arrival.routeName} - {arrival.headsign}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography className="arrival-time">
                              <AccessTimeIcon sx={{ fontSize: 16 }} />
                              {arrival.minutesUntilArrival}m (
                              {arrival.scheduledArrival})
                            </Typography>
                            {arrival.isRealtime && (
                              <span
                                className={`minutes-badge ${
                                  arrival.delayMinutes > 0
                                    ? "delayed"
                                    : "realtime"
                                }`}
                              >
                                {arrival.delayMinutes > 0
                                  ? `${arrival.delayMinutes}m late`
                                  : "On time"}
                              </span>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontStyle: "italic" }}
                    >
                      No upcoming buses scheduled for this stop
                    </Typography>
                  )}
                </StyledInfoWindowContent>
              </InfoWindow>
            )}
          </GoogleMap>
        </GoogleMapsProvider>
      </StyledPaper>
    </Container>
  );
}
