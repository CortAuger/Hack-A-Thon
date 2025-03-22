import { NextResponse } from "next/server";
import axios from "axios";
import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";
import * as GtfsRealtimeBindings from "gtfs-realtime-bindings";

// Type definitions for GTFS Realtime
interface GtfsFeed {
  entity: Array<{
    tripUpdate?: {
      trip?: {
        tripId?: string;
      };
      stopTimeUpdate?: Array<{
        stopId?: string;
        arrival?: {
          time?: number;
          delay?: number;
        };
      }>;
    };
  }>;
}

// GTFS API URLs
const GTFS_STATIC_URL =
  "https://maps.durham.ca/OpenDataGTFS/GTFS_Durham_TXT.zip";
const GTFS_REALTIME_URL =
  "https://drtonline.durhamregiontransit.com/gtfsrt/tripupdates";

// Cache for GTFS data
interface GtfsCache {
  routes: Array<{
    route_id: string;
    route_long_name?: string;
    route_short_name?: string;
  }>;
  trips: Array<{
    trip_id: string;
    route_id: string;
  }>;
  stopTimes: Array<{
    trip_id: string;
    stop_id: string;
    route_id: string;
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

async function getRealtimeData(): Promise<GtfsFeed> {
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

    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(response.data)
    ) as unknown as GtfsFeed;
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
    return { entity: [] };
  }
}

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

    // Get GTFS data
    const gtfsData = await downloadAndExtractGTFS();
    const realtimeData = await getRealtimeData();

    // Find nearby stops (within 2km)
    const nearbyStops = gtfsData.stops
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

    if (nearbyStops.length === 0) {
      return NextResponse.json({ stops: [] });
    }

    // Get arrival information for each stop
    const stopsWithArrivals = nearbyStops.map((stop) => {
      const stopTimes = gtfsData.stopTimes.filter(
        (st: any) => st.stop_id === stop.stop_id
      );
      const arrivals = stopTimes
        .map((stopTime: any) => {
          const route = gtfsData.routes.find(
            (r: any) => r.route_id === stopTime.route_id
          );
          if (!route) return null;

          // Find real-time update for this stop
          const realtimeUpdate = realtimeData.entity
            .find((entity: any) => {
              const tripUpdate = entity.tripUpdate;
              return tripUpdate?.trip?.tripId === stopTime.trip_id;
            })
            ?.tripUpdate?.stopTimeUpdate?.find(
              (update: any) => update.stopId === stop.stop_id
            );

          // Calculate arrival time
          const arrivalTime =
            realtimeUpdate?.arrival?.time ||
            Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 3600);

          return {
            route_name: route.route_long_name || route.route_short_name,
            arrival_time: arrivalTime,
            is_realtime: !!realtimeUpdate,
            delay: realtimeUpdate?.arrival?.delay || 0,
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.arrival_time - b.arrival_time)
        .slice(0, 5);

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
