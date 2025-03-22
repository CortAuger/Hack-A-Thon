import { NextResponse } from "next/server";
import axios from "axios";
import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";

// GTFS API URL
const GTFS_STATIC_URL =
  "https://maps.durham.ca/OpenDataGTFS/GTFS_Durham_TXT.zip";

// Cache for GTFS data
interface GtfsCache {
  routes: Array<{
    route_id: string;
    route_short_name: string;
    route_long_name: string;
  }>;
  trips: Array<{
    trip_id: string;
    route_id: string;
    trip_headsign: string;
  }>;
  stopTimes: Array<{
    trip_id: string;
    stop_id: string;
    arrival_time: string;
    departure_time: string;
    stop_sequence: string;
  }>;
  stops: Array<{
    stop_id: string;
    stop_name: string;
    stop_lat: string;
    stop_lon: string;
  }>;
  lastUpdated: number;
}

let gtfsCache: GtfsCache | null = null;

// Cache duration - 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

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

// Helper function to convert GTFS time to Date
function parseGtfsTime(timeStr: string): Date {
  const [hours, minutes, seconds] = timeStr.split(":").map(Number);
  const now = new Date();
  const result = new Date(now);

  // Handle times past midnight (e.g., 25:00:00)
  const dayOffset = Math.floor(hours / 24);
  const adjustedHours = hours % 24;

  result.setHours(adjustedHours, minutes, seconds);
  result.setDate(result.getDate() + dayOffset);

  return result;
}

// Helper function to get upcoming arrivals
function getUpcomingArrivals(stopId: string, gtfsData: GtfsCache): any[] {
  const now = new Date();
  const upcoming: any[] = [];

  // Get all stop times for this stop
  const stopTimes = gtfsData.stopTimes.filter((st) => st.stop_id === stopId);

  stopTimes.forEach((st) => {
    const trip = gtfsData.trips.find((t) => t.trip_id === st.trip_id);
    if (!trip) return;

    const route = gtfsData.routes.find((r) => r.route_id === trip.route_id);
    if (!route) return;

    const arrivalTime = parseGtfsTime(st.arrival_time);

    // Only include if arrival is in the future (within next 2 hours)
    if (arrivalTime > now && arrivalTime.getTime() - now.getTime() <= 7200000) {
      upcoming.push({
        routeId: route.route_id,
        routeName: route.route_short_name,
        headsign: trip.trip_headsign,
        scheduledArrival: arrivalTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        minutesUntilArrival: Math.round(
          (arrivalTime.getTime() - now.getTime()) / 60000
        ),
      });
    }
  });

  // Sort by arrival time and limit to next 5 arrivals
  return upcoming
    .sort((a, b) => a.minutesUntilArrival - b.minutesUntilArrival)
    .slice(0, 5);
}

async function downloadAndExtractGTFS() {
  if (gtfsCache && Date.now() - gtfsCache.lastUpdated < CACHE_DURATION) {
    return gtfsCache;
  }

  console.log("Downloading GTFS data...");
  try {
    const response = await axios.get(GTFS_STATIC_URL, {
      responseType: "arraybuffer",
      timeout: 10000,
      maxContentLength: 50 * 1024 * 1024,
      headers: {
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
      },
    });

    if (!response.data) {
      throw new Error("Empty response from GTFS static feed");
    }

    const zip = new AdmZip(response.data);

    // Read required files
    const routesEntry = zip.getEntry("routes.txt");
    const tripsEntry = zip.getEntry("trips.txt");
    const stopTimesEntry = zip.getEntry("stop_times.txt");
    const stopsEntry = zip.getEntry("stops.txt");

    if (!routesEntry || !tripsEntry || !stopTimesEntry || !stopsEntry) {
      throw new Error("Required GTFS files not found in ZIP");
    }

    // Parse CSV data
    const routes = parse(routesEntry.getData().toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    const trips = parse(tripsEntry.getData().toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    const stopTimes = parse(stopTimesEntry.getData().toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    const stops = parse(stopsEntry.getData().toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    gtfsCache = {
      routes,
      trips,
      stopTimes,
      stops,
      lastUpdated: Date.now(),
    };

    console.log("GTFS data loaded successfully");
    return gtfsCache;
  } catch (error) {
    console.error("Error loading GTFS data:", error);
    if (axios.isAxiosError(error)) {
      console.error("Network error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: GTFS_STATIC_URL,
      });
    }
    throw new Error(
      error instanceof Error ? error.message : "Failed to load GTFS data"
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    const radius = 10; // Changed from 5 to 10km

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Get GTFS data
    const gtfsData = await downloadAndExtractGTFS();

    // Find nearby stops (within 5km instead of 2km)
    const nearbyStops = gtfsData.stops
      .map((stop: any) => {
        const upcomingArrivals = getUpcomingArrivals(stop.stop_id, gtfsData);

        return {
          id: stop.stop_id,
          name: stop.stop_name,
          latitude: parseFloat(stop.stop_lat),
          longitude: parseFloat(stop.stop_lon),
          distance: calculateDistance(
            parseFloat(lat),
            parseFloat(lon),
            parseFloat(stop.stop_lat),
            parseFloat(stop.stop_lon)
          ),
          arrivals: upcomingArrivals,
        };
      })
      .filter((stop) => stop.distance <= radius) // Increase radius to 10km
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 60); // Increase number of stops to 60

    return NextResponse.json({ stops: nearbyStops });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to fetch nearby stops" },
      { status: 500 }
    );
  }
}
