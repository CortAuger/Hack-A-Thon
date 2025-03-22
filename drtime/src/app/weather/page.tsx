"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import AirIcon from "@mui/icons-material/Air";
import WbSunnyIcon from "@mui/icons-material/WbSunny";

// Styled components for weather display
const WeatherCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(2),
  padding: theme.spacing(2),
  textAlign: "center",
  backgroundColor: theme.palette.background.paper,
}));

const WeatherIcon = styled("img")({
  width: "64px",
  height: "64px",
});

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
}

export default function WeatherPage() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        // Get user's location
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          }
        );

        const response = await fetch(
          `/api/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch weather data");
        }

        const data = await response.json();
        setWeatherData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load weather data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!weatherData) {
    return null;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Current Weather
      </Typography>

      <Grid container spacing={2}>
        {/* Main weather info */}
        <Grid item xs={12} md={6}>
          <WeatherCard>
            <CardContent>
              <WeatherIcon
                src={`http://openweathermap.org/img/wn/${weatherData.icon}@2x.png`}
                alt={weatherData.description}
              />
              <Typography variant="h3" component="div">
                {weatherData.temperature}°C
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                {weatherData.description}
              </Typography>
            </CardContent>
          </WeatherCard>
        </Grid>

        {/* Additional weather details */}
        <Grid item xs={12} md={6}>
          <WeatherCard>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <ThermostatIcon sx={{ mr: 1 }} />
                    <Typography>
                      Feels like: {weatherData.feelsLike}°C
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <WaterDropIcon sx={{ mr: 1 }} />
                    <Typography>Humidity: {weatherData.humidity}%</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <AirIcon sx={{ mr: 1 }} />
                    <Typography>Wind: {weatherData.windSpeed} m/s</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <WbSunnyIcon sx={{ mr: 1 }} />
                    <Typography>{weatherData.description}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </WeatherCard>
        </Grid>
      </Grid>
    </Box>
  );
}
