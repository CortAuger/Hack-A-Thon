/**
 * Weather Page
 * Displays current weather conditions and forecasts for Durham Region.
 * Provides detailed weather information including temperature, humidity, air quality,
 * and precipitation forecasts.
 *
 * Features:
 * - Current weather conditions
 * - Air quality index
 * - Hourly forecast
 * - 5-day forecast
 * - Weather icons and descriptions
 */

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

/**
 * Styled component for weather cards
 * Provides consistent styling for weather information display
 */
const WeatherCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: "center",
  backgroundColor: "#E8F5E9", // Light green background
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
}));

/**
 * Styled component for weather icons
 * Ensures consistent sizing and spacing for weather icons
 */
const WeatherIcon = styled("img")({
  width: 50,
  height: 50,
  margin: "8px auto",
});

/**
 * Styled component for information rows
 * Provides consistent layout for weather data display
 */
const InfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

/**
 * WeatherPage Component
 * Main component for displaying weather information
 */
export default function WeatherPage() {
  // State management for weather data and loading states
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches weather data for Durham Region
   * Uses default coordinates centered on the region
   */
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

      {/* Current Weather Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Current Conditions Card */}
        <Grid item xs={12} md={6}>
          <WeatherCard>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Current Conditions
              </Typography>
              {/* Weather Icon and Temperature Display */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <WeatherIcon
                  src={`https://openweathermap.org/img/wn/${weather.current.weather[0].icon}@2x.png`}
                  alt={weather.current.weather[0].description}
                />
                <Typography variant="h3" sx={{ ml: 2 }}>
                  {formatTemp(weather.current.temp)}
                </Typography>
              </Box>
              {/* Weather Description */}
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {weather.current.weather[0].description}
              </Typography>
              {/* Additional Weather Information */}
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

        {/* Air Quality Card */}
        <Grid item xs={12} md={6}>
          <WeatherCard>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Air Quality
              </Typography>
              {weather.air_quality && (
                <>
                  {/* Air Quality Level */}
                  <Typography variant="h6" gutterBottom>
                    {getAQIDescription(weather.air_quality.aqi).level}
                  </Typography>
                  {/* Air Quality Description */}
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {getAQIDescription(weather.air_quality.aqi).description}
                  </Typography>
                  {/* Air Quality Metrics */}
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

      {/* Hourly Forecast Section */}
      <Typography variant="h5" gutterBottom>
        Hourly Forecast
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {/* Hourly Weather Cards */}
        {weather.hourly.map((hour) => (
          <Grid item xs={6} sm={3} md={2} key={hour.dt}>
            <WeatherCard>
              <CardContent>
                {/* Time Display */}
                <Typography variant="subtitle2" gutterBottom>
                  {formatTime(hour.dt)}
                </Typography>
                {/* Weather Icon */}
                <WeatherIcon
                  src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`}
                  alt={hour.weather[0].description}
                />
                {/* Temperature */}
                <Typography variant="h6">
                  {formatTemp(hour.temp as number)}
                </Typography>
                {/* Precipitation Probability */}
                {hour.pop > 0 && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <WaterDrop fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(hour.pop * 100)}%
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </WeatherCard>
          </Grid>
        ))}
      </Grid>

      {/* Daily Forecast Section */}
      <Typography variant="h5" gutterBottom>
        5-Day Forecast
      </Typography>
      <Grid container spacing={2}>
        {/* Daily Weather Cards */}
        {weather.daily.slice(0, 5).map((day) => (
          <Grid item xs={12} sm={6} md={2.4} key={day.dt}>
            <WeatherCard>
              <CardContent>
                {/* Date Display */}
                <Typography variant="subtitle1" gutterBottom>
                  {formatDate(day.dt)}
                </Typography>
                {/* Weather Icon */}
                <WeatherIcon
                  src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
                  alt={day.weather[0].description}
                />
                {/* Temperature Range */}
                <Typography variant="body1">
                  {formatTemp((day.temp as any).max)} /{" "}
                  {formatTemp((day.temp as any).min)}
                </Typography>
                {/* Weather Description */}
                <Typography variant="body2" color="text.secondary">
                  {day.weather[0].description}
                </Typography>
                {/* Precipitation Probability */}
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
