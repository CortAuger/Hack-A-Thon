/**
 * Search Page
 * This page provides a transit route search interface using Google Maps.
 * Users can search for bus routes between two locations with current location support.
 *
 * Features:
 * - Current location detection
 * - Address autocomplete
 * - Interactive map display
 * - Transit directions with multiple options
 * - Real-time route updates
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Box,
  Container,
  TextField,
  Typography,
  CircularProgress,
  Autocomplete,
  IconButton,
  Tooltip,
  Paper,
  Button,
  Card,
  CardContent,
  InputAdornment,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import GoogleMapsProvider from "@/components/GoogleMapsProvider";
import {
  getCurrentLocation,
  getPlaceSuggestions,
} from "@/services/googleMapsService";

/**
 * Styled component for the map container
 * Provides consistent styling for the Google Maps embed
 */
const MapContainer = styled(Box)({
  position: "relative",
  borderRadius: "8px",
  overflow: "hidden",
  height: "100%",
  border: "1px solid rgba(0, 0, 0, 0.12)",
});

/**
 * Styled component for the search container
 * Provides a semi-transparent background for search controls
 */
const SearchContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: "8px",
  backgroundColor: "rgba(255, 255, 255, 0.9)",
}));

/**
 * Styled component for the autocomplete inputs
 * Ensures consistent styling with the Material-UI theme
 */
const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: theme.palette.background.paper,
    "&:hover": {
      backgroundColor: theme.palette.background.paper,
    },
  },
}));

/**
 * Interface for place suggestions from Google Places API
 */
interface PlaceSuggestion {
  description: string;
  place_id: string;
}

const libraries = ["places"];

/**
 * SearchPage Component
 * Main component for the transit route search functionality
 */
export default function SearchPage() {
  // State management for search inputs and results
  const [origin, setOrigin] = useState<string>("");
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>(
    []
  );
  const [destination, setDestination] = useState<PlaceSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(true);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  /**
   * Checks if Google Maps API is loaded and gets current location
   */
  useEffect(() => {
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true);
        handleGetCurrentLocation();
      } else {
        setTimeout(checkGoogleMapsLoaded, 100);
      }
    };
    checkGoogleMapsLoaded();
  }, []);

  /**
   * Gets user's current location and updates origin field
   */
  const handleGetCurrentLocation = async () => {
    if (!isGoogleMapsLoaded) return;

    try {
      setLoading(true);
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      setIsUsingCurrentLocation(true);

      const geocoder = new window.google.maps.Geocoder();
      const result = await geocoder.geocode({
        location: { lat: location.lat, lng: location.lng },
      });
      if (result.results[0]) {
        setOrigin(result.results[0].formatted_address);
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      setError("Failed to get current location");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles input changes in the origin field
   * Fetches place suggestions for autocomplete
   */
  const handleOriginInput = async (input: string) => {
    setIsUsingCurrentLocation(false);
    if (input.length > 2) {
      try {
        const suggestions = await getPlaceSuggestions(input);
        setOriginSuggestions(suggestions);
      } catch (error) {
        console.error("Error getting suggestions:", error);
      }
    } else {
      setOriginSuggestions([]);
    }
  };

  /**
   * Handles input changes in the destination field
   * Fetches place suggestions for autocomplete
   */
  const handleDestinationInput = async (input: string) => {
    if (input.length > 2) {
      try {
        const suggestions = await getPlaceSuggestions(input);
        setSuggestions(suggestions);
      } catch (error) {
        console.error("Error getting suggestions:", error);
      }
    } else {
      setSuggestions([]);
    }
  };

  /**
   * Handles the search action
   * Generates Google Maps embed URL with transit directions
   */
  const handleSearch = useCallback(() => {
    if (!origin || !destination) return;
    setLoading(true);

    const embedUrl = `https://www.google.com/maps/embed/v1/directions?key=${
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    }&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(
      destination.description
    )}&mode=transit&region=ca&zoom=13&language=en`;

    setMapUrl(embedUrl);
    setLoading(false);
  }, [origin, destination]);

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          align="center"
          sx={{ mb: 4 }}
        >
          Find Your Bus Route
        </Typography>

        <SearchContainer elevation={3}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <StyledAutocomplete
                  fullWidth
                  options={originSuggestions}
                  getOptionLabel={(option: any) =>
                    typeof option === "string"
                      ? option
                      : option?.description || ""
                  }
                  value={origin}
                  onChange={(_, newValue: any) => {
                    setIsUsingCurrentLocation(false);
                    setOrigin(
                      typeof newValue === "string"
                        ? newValue
                        : newValue?.description || ""
                    );
                  }}
                  onInputChange={(_, newInputValue) =>
                    handleOriginInput(newInputValue)
                  }
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="From"
                      placeholder={
                        isUsingCurrentLocation
                          ? "Using current location"
                          : "Enter starting point"
                      }
                      size="medium"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOnIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
                <Tooltip title="Use current location">
                  <span>
                    <IconButton
                      onClick={handleGetCurrentLocation}
                      disabled={loading}
                      color={isUsingCurrentLocation ? "primary" : "default"}
                      size="large"
                    >
                      <MyLocationIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              <StyledAutocomplete
                fullWidth
                options={suggestions}
                getOptionLabel={(option: PlaceSuggestion) => option.description}
                value={destination}
                onChange={(_, newValue) =>
                  setDestination(newValue as PlaceSuggestion | null)
                }
                onInputChange={(_, newInputValue) =>
                  handleDestinationInput(newInputValue)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="To"
                    placeholder="Enter destination"
                    size="medium"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              disabled={!origin || !destination || loading}
              startIcon={<DirectionsBusIcon />}
              size="large"
              sx={{ mt: 1 }}
            >
              Find Route
            </Button>
          </Box>
        </SearchContainer>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {origin && destination && (
          <Box sx={{ display: "flex", gap: 2, height: "calc(100vh - 300px)" }}>
            {/* Left side - Map */}
            <Box sx={{ flex: 2, minWidth: 0 }}>
              <MapContainer>
                {mapUrl ? (
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={mapUrl}
                  />
                ) : (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "text.secondary",
                      bgcolor: "background.paper",
                    }}
                  >
                    Click Find Route to see the transit directions
                  </Box>
                )}
              </MapContainer>
            </Box>

            {/* Right side - Transit Information */}
            <Box sx={{ width: "350px", minWidth: "350px" }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Transit Information
                    </Typography>

                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        From: {origin}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        To: {destination.description}
                      </Typography>

                      <Box
                        sx={{
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 1,
                          p: 2,
                          bgcolor: "#f8f9fa",
                        }}
                      >
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Transit information is available on the map. You can
                          see:
                        </Typography>
                        <ul style={{ margin: 0, paddingLeft: "20px" }}>
                          <li>Bus routes and numbers</li>
                          <li>Departure and arrival times</li>
                          <li>Walking distances</li>
                          <li>Total travel time</li>
                        </ul>
                      </Box>

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Click ' More Options' on the map for more details
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
}
