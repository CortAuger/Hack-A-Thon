import { NextResponse } from "next/server";
import axios from "axios";
import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";
import { transit_realtime } from "gtfs-realtime-bindings";

// GTFS API URLs
const GTFS_STATIC_URL = "https://www.durhamregiontransit.com/gtfs/gtfs.zip";
const GTFS_REALTIME_URL =
  "https://drtonline.durhamregiontransit.com/gtfsrealtime/TripUpdates";

// Cache for GTFS static data
let staticDataCache: {
  routes: Map<string, any>;
  stops: Map<string, any>;
  stopTimes: Map<string, any[]>;
} | null = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface Stop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  arrivals: Arrival[];
}

interface Arrival {
  route_name: string;
  arrival_time: number;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Load and cache GTFS static data
async function loadStaticData() {
  try {
    if (staticDataCache && Date.now() - lastCacheUpdate < CACHE_DURATION) {
      return staticDataCache;
    }

    console.log("Fetching GTFS static data...");
    const response = await axios.get(GTFS_STATIC_URL, {
      responseType: "arraybuffer",
    });

    const zip = new AdmZip(response.data);
    const routes = new Map();
    const stops = new Map();
    const stopTimes = new Map();

    // Process routes.txt
    const routesFile = zip.getEntry("routes.txt");
    if (routesFile) {
      const routesContent = routesFile.getData().toString("utf-8");
      const routesRecords = parse(routesContent, {
        columns: true,
        skip_empty_lines: true,
      });
      routesRecords.forEach((route: any) => {
        routes.set(route.route_id, route);
      });
    }

    // Process stops.txt
    const stopsFile = zip.getEntry("stops.txt");
    if (stopsFile) {
      const stopsContent = stopsFile.getData().toString("utf-8");
      const stopsRecords = parse(stopsContent, {
        columns: true,
        skip_empty_lines: true,
      });
      stopsRecords.forEach((stop: any) => {
        stops.set(stop.stop_id, stop);
      });
    }

    // Process stop_times.txt
    const stopTimesFile = zip.getEntry("stop_times.txt");
    if (stopTimesFile) {
      const stopTimesContent = stopTimesFile.getData().toString("utf-8");
      const stopTimesRecords = parse(stopTimesContent, {
        columns: true,
        skip_empty_lines: true,
      });
      stopTimesRecords.forEach((stopTime: any) => {
        if (!stopTimes.has(stopTime.stop_id)) {
          stopTimes.set(stopTime.stop_id, []);
        }
        stopTimes.get(stopTime.stop_id).push(stopTime);
      });
    }

    staticDataCache = { routes, stops, stopTimes };
    lastCacheUpdate = Date.now();
    console.log("GTFS static data loaded successfully");
    return staticDataCache;
  } catch (error) {
    console.error("Error loading GTFS static data:", error);
    throw new Error("Failed to load GTFS static data");
  }
}

// Get real-time updates
async function getRealtimeUpdates() {
  try {
    console.log("Fetching GTFS real-time data...");
    const response = await axios.get(GTFS_REALTIME_URL, {
      responseType: "arraybuffer",
      headers: {
        Accept: "application/x-protobuf",
      },
    });

    if (!response.data || response.data.length === 0) {
      console.warn("Empty response from GTFS realtime feed");
      return { entity: [] };
    }

    const feed = transit_realtime.FeedMessage.decode(response.data);
    console.log("GTFS real-time data loaded successfully");
    return feed;
  } catch (error) {
    console.error("Error loading GTFS real-time data:", error);
    if (axios.isAxiosError(error)) {
      console.error("API Error Details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
    // Return empty feed instead of throwing error to allow static data to still work
    return { entity: [] };
  }
}

// GET handler for nearby stops
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lon = parseFloat(searchParams.get("lon") || "0");

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Load static data and real-time updates
    const [staticData, realtimeData] = await Promise.all([
      loadStaticData(),
      getRealtimeUpdates(),
    ]);

    // Find nearby stops (within 2km)
    const nearbyStops = Array.from(staticData.stops.values())
      .map((stop: any) => ({
        ...stop,
        stop_lat: parseFloat(stop.stop_lat),
        stop_lon: parseFloat(stop.stop_lon),
        distance: calculateDistance(
          lat,
          lon,
          parseFloat(stop.stop_lat),
          parseFloat(stop.stop_lon)
        ),
      }))
      .filter((stop) => stop.distance <= 2)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);

    // Get arrival information for each stop
    const stopsWithArrivals = nearbyStops.map((stop) => {
      const stopTimes = staticData.stopTimes.get(stop.stop_id) || [];
      const arrivals = stopTimes
        .map((stopTime: any) => {
          const route = staticData.routes.get(stopTime.route_id);
          const tripUpdate = realtimeData.entity.find(
            (entity) => entity.tripUpdate?.trip?.tripId === stopTime.trip_id
          );

          if (!route) return null;

          const arrivalTime = tripUpdate
            ? (tripUpdate.tripUpdate?.stopTimeUpdate?.[0]?.arrival
                ?.time as number) || parseInt(stopTime.arrival_time)
            : parseInt(stopTime.arrival_time);

          return {
            route_name: route.route_long_name,
            arrival_time: arrivalTime,
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.arrival_time - b.arrival_time)
        .slice(0, 5); // Get next 5 arrivals

      return {
        stop_id: stop.stop_id,
        stop_name: stop.stop_name,
        stop_lat: stop.stop_lat,
        stop_lon: stop.stop_lon,
        distance: stop.distance,
        arrivals: arrivals,
      };
    });

    return NextResponse.json({ stops: stopsWithArrivals });
  } catch (error) {
    console.error("Nearby stops API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch nearby stops",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
