/**
 * Next.js Configuration
 * Defines build-time and runtime configuration for the Next.js application.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features
  experimental: {
    // Enable server actions for form handling
    serverActions: true,
  },

  // Configure image domains for next/image
  images: {
    domains: [
      "maps.googleapis.com", // Allow Google Maps images
      "openweathermap.org", // Allow OpenWeatherMap images
    ],
  },

  // Environment variables configuration
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_OPENWEATHERMAP_API_KEY:
      process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY,
    NEXT_PUBLIC_OPENWEATHERMAP_URL: process.env.NEXT_PUBLIC_OPENWEATHERMAP_URL,
  },
};

module.exports = nextConfig;
