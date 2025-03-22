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

interface Stop {
  stop_id: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
  arrival_time: string;
  departure_time: string;
}

interface RouteDetails {
  route_id: string;
  directions: string[];
  stops: Stop[];
  total_trips: number;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(2),
  maxHeight: "calc(100vh - 200px)",
  overflow: "auto",
}));

export default function RoutesList() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
    fetchRouteDetails(route.route_id);
  };

  const filteredRoutes =
    routes?.filter(
      (route) =>
        route.route_short_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        route.route_long_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) ?? [];

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
        <Typography variant="h4" component="h1" gutterBottom>
          Bus Routes
        </Typography>

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

        <Box sx={{ display: "flex", gap: 2 }}>
          <StyledPaper sx={{ flex: 1 }}>
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

          {selectedRoute && (
            <StyledPaper sx={{ flex: 1 }}>
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

              {loadingDetails ? (
                <Box display="flex" justifyContent="center" my={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : routeDetails ? (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Route Directions
                  </Typography>
                  {routeDetails.directions.map((direction, index) => (
                    <Typography key={index} variant="body1">
                      {direction}
                    </Typography>
                  ))}

                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Stop Sequence
                  </Typography>
                  <List>
                    {routeDetails.stops.map((stop, index) => (
                      <ListItem
                        key={stop.stop_id}
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
