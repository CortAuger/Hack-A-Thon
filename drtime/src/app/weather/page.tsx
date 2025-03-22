"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  WbSunny,
  Opacity,
  Air,
  WaterDrop,
  Thermostat,
} from "@mui/icons-material";
import {
  WeatherResponse,
  fetchWeatherData,
  getUVIndexRecommendation,
  getAQIDescription,
} from "@/services/weatherService";

// Styled components for weather cards
const WeatherCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.palette.background.paper,
  transition: "transform 0.2s",
  "&:hover": {
    transform: "translateY(-4px)",
  },
}));

const WeatherIcon = styled("img")({
  width: 50,
  height: 50,
  margin: "8px auto",
});

const InfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Default coordinates for Durham Region
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const data = await fetchWeatherData(43.8971, -78.8658);
        setWeather(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch weather data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <Container>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="80vh"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!weather) return null;

  const formatTemp = (temp: number) => `${Math.round(temp)}°C`;
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Weather in {weather.location_name}
      </Typography>

      {/* Current Weather */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <WeatherCard>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Current Conditions
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <WeatherIcon
                  src={`https://openweathermap.org/img/wn/${weather.current.weather[0].icon}@2x.png`}
                  alt={weather.current.weather[0].description}
                />
                <Typography variant="h3" sx={{ ml: 2 }}>
                  {formatTemp(weather.current.temp)}
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {weather.current.weather[0].description}
              </Typography>
              <InfoRow>
                <Thermostat />
                <Typography>
                  Feels like: {formatTemp(weather.current.feels_like)}
                </Typography>
              </InfoRow>
              <InfoRow>
                <Opacity />
                <Typography>Humidity: {weather.current.humidity}%</Typography>
              </InfoRow>
            </CardContent>
          </WeatherCard>
        </Grid>

        {/* Air Quality */}
        <Grid item xs={12} md={6}>
          <WeatherCard>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Air Quality
              </Typography>
              {weather.air_quality && (
                <>
                  <Typography variant="h6" gutterBottom>
                    {getAQIDescription(weather.air_quality.aqi).level}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {getAQIDescription(weather.air_quality.aqi).description}
                  </Typography>
                  <InfoRow>
                    <Air />
                    <Typography>
                      PM2.5: {weather.air_quality.components.pm2_5} µg/m³
                    </Typography>
                  </InfoRow>
                  <InfoRow>
                    <Air />
                    <Typography>
                      PM10: {weather.air_quality.components.pm10} µg/m³
                    </Typography>
                  </InfoRow>
                </>
              )}
            </CardContent>
          </WeatherCard>
        </Grid>
      </Grid>

      {/* Hourly Forecast */}
      <Typography variant="h5" gutterBottom>
        Hourly Forecast
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {weather.hourly.map((hour) => (
          <Grid item xs={6} sm={3} md={2} key={hour.dt}>
            <WeatherCard>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  {formatTime(hour.dt)}
                </Typography>
                <WeatherIcon
                  src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`}
                  alt={hour.weather[0].description}
                />
                <Typography variant="h6">
                  {formatTemp(hour.temp as number)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {hour.pop > 0 && (
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <WaterDrop fontSize="small" />
                      {Math.round(hour.pop * 100)}%
                    </Box>
                  )}
                </Typography>
              </CardContent>
            </WeatherCard>
          </Grid>
        ))}
      </Grid>

      {/* Daily Forecast */}
      <Typography variant="h5" gutterBottom>
        5-Day Forecast
      </Typography>
      <Grid container spacing={2}>
        {weather.daily.slice(0, 5).map((day) => (
          <Grid item xs={12} sm={6} md={2.4} key={day.dt}>
            <WeatherCard>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {formatDate(day.dt)}
                </Typography>
                <WeatherIcon
                  src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
                  alt={day.weather[0].description}
                />
                <Typography variant="body1">
                  {formatTemp((day.temp as any).max)} /{" "}
                  {formatTemp((day.temp as any).min)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {day.weather[0].description}
                </Typography>
                {day.pop > 0 && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <WaterDrop fontSize="small" />
                    <Typography variant="body2">
                      {Math.round(day.pop * 100)}%
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </WeatherCard>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
