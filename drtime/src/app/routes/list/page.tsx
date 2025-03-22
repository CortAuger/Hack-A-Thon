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
} from "@mui/material";
import { styled } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import Navigation from "@/components/Navigation";

interface Route {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: number;
  route_color: string;
  route_text_color: string;
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

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await fetch("/api/routes/list");
      if (!response.ok) {
        throw new Error("Failed to fetch routes");
      }
      const data = await response.json();
      setRoutes(data.routes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch routes");
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutes = routes.filter(
    (route) =>
      route.route_short_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.route_long_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <>
        <Navigation />
        <Container maxWidth="lg">
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="80vh"
          >
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Bus Routes
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

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
                {filteredRoutes.map((route, index) => (
                  <div key={route.route_id}>
                    <ListItemButton
                      selected={selectedRoute?.route_id === route.route_id}
                      onClick={() => setSelectedRoute(route)}
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
                ))}
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
                  {selectedRoute.route_type === 3
                    ? "Bus"
                    : selectedRoute.route_type === 0
                    ? "Tram"
                    : selectedRoute.route_type === 1
                    ? "Subway"
                    : selectedRoute.route_type === 2
                    ? "Rail"
                    : "Other"}
                </Typography>
              </StyledPaper>
            )}
          </Box>
        </Box>
      </Container>
    </>
  );
}
