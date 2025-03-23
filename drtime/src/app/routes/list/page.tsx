/**
 * Bus Routes List Page
 * This page displays a comprehensive list of all bus routes and their details.
 * Users can search for routes and view detailed information about each route.
 *
 * Features:
 * - Searchable list of all bus routes
 * - Detailed view of selected route information
 * - Real-time route filtering
 * - Stop sequence and schedule display
 */

"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**
 * Interface for basic route information
 * Contains route identifiers and statistics
 */
interface Route {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: string;
  route_color: string;
  route_text_color: string;
  trips_count: number;
  stops_count: number;
}

/**
 * Interface for stop information
 * Contains stop location and timing details
 */
interface Stop {
  stop_id: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
  arrival_time: string;
  departure_time: string;
}

/**
 * Interface for detailed route information
 * Includes directions and stop sequence
 */
interface RouteDetails {
  route_id: string;
  directions: string[];
  stops: Stop[];
  total_trips: number;
}

/**
 * Styled component for the main content container
 * Provides scrollable container with maximum height
 */
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(2),
  maxHeight: "calc(100vh - 200px)",
  overflow: "auto",
}));

/**
 * RoutesList Component
 * Main component for displaying and managing bus routes
 * Handles route fetching, searching, and detail display
 */
export default function RoutesList() {
  // State management for routes and UI
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  /**
   * Fetches the list of all routes on component mount
   * Handles loading states and error cases
   */
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/routes/list");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRoutes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch routes");
        console.error("Error fetching routes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  /**
   * Fetches detailed information for a specific route
   * @param routeId The ID of the route to fetch details for
   */
  const fetchRouteDetails = async (routeId: string) => {
    try {
      setLoadingDetails(true);
      const response = await fetch(`/api/routes/${routeId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRouteDetails(data);
    } catch (err) {
      console.error("Error fetching route details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch route details"
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  /**
   * Handles route selection and fetches its details
   * @param route The selected route object
   */
  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
    fetchRouteDetails(route.route_id);
  };

  // Filter routes based on search term
  const filteredRoutes =
    routes?.filter(
      (route) =>
        route.route_short_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        route.route_long_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) ?? [];

  // Loading state display
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Error state display
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ my: 4 }}>
        {/* Page Title */}
        <Typography variant="h4" component="h1" gutterBottom>
          Bus Routes
        </Typography>

        {/* Search Input */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search routes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {/* Main Content Layout */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          {/* Routes List Panel */}
          <StyledPaper
            sx={{
              flex: { xs: "1 1 auto", md: 1 },
              maxHeight: {
                xs: "calc(40vh - 100px)",
                md: "calc(100vh - 200px)",
              },
            }}
          >
            <List>
              {filteredRoutes.length === 0 ? (
                <Typography>No results found</Typography>
              ) : (
                filteredRoutes.map((route, index) => (
                  <div key={route.route_id}>
                    <ListItemButton
                      selected={selectedRoute?.route_id === route.route_id}
                      onClick={() => handleRouteSelect(route)}
                    >
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {/* Route Number Badge */}
                            <Box
                              sx={{
                                bgcolor: `#${route.route_color || "000000"}`,
                                color: `#${route.route_text_color || "FFFFFF"}`,
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                minWidth: 50,
                                textAlign: "center",
                              }}
                            >
                              {route.route_short_name}
                            </Box>
                            <Typography>{route.route_long_name}</Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                    {index < filteredRoutes.length - 1 && <Divider />}
                  </div>
                ))
              )}
            </List>
          </StyledPaper>

          {/* Route Details Panel */}
          {selectedRoute && (
            <StyledPaper
              sx={{
                flex: { xs: "1 1 auto", md: 1 },
                maxHeight: {
                  xs: "calc(60vh - 100px)",
                  md: "calc(100vh - 200px)",
                },
              }}
            >
              {/* Basic Route Information */}
              <Typography variant="h6" gutterBottom>
                Route Details
              </Typography>
              <Typography variant="body1" paragraph>
                Route Number: {selectedRoute.route_short_name}
              </Typography>
              <Typography variant="body1" paragraph>
                Route Name: {selectedRoute.route_long_name}
              </Typography>
              <Typography variant="body1">
                Type:{" "}
                {selectedRoute.route_type === "3"
                  ? "Bus"
                  : selectedRoute.route_type === "0"
                  ? "Tram"
                  : selectedRoute.route_type === "1"
                  ? "Subway"
                  : selectedRoute.route_type === "2"
                  ? "Rail"
                  : "Other"}
              </Typography>
              <Typography variant="body1">
                Total Stops: {selectedRoute.stops_count}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Total Trips: {selectedRoute.trips_count}
              </Typography>

              {/* Loading State for Route Details */}
              {loadingDetails ? (
                <Box display="flex" justifyContent="center" my={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : routeDetails ? (
                <>
                  {/* Route Directions */}
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Route Directions
                  </Typography>
                  {routeDetails.directions.map((direction, index) => (
                    <Typography key={index} variant="body1">
                      {direction}
                    </Typography>
                  ))}

                  {/* Stop Sequence */}
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Stop Sequence
                  </Typography>
                  <List>
                    {routeDetails.stops.map((stop, index) => (
                      <ListItem
                        key={`${stop.stop_id}-${index}`}
                        divider={index < routeDetails.stops.length - 1}
                      >
                        <ListItemText
                          primary={stop.stop_name}
                          secondary={`Arrival: ${stop.arrival_time} | Departure: ${stop.departure_time}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              ) : null}
            </StyledPaper>
          )}
        </Box>
      </Box>
    </Container>
  );
}
