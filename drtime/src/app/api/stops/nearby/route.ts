import { NextResponse } from "next/server";
import axios from "axios";
import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";
import * as GtfsRealtimeBindings from "gtfs-realtime-bindings";

// GTFS API URLs
const GTFS_STATIC_URL =
  "https://maps.durham.ca/OpenDataGTFS/GTFS_Durham_TXT.zip";
const GTFS_REALTIME_TRIP_UPDATES_URL =
  "https://drtonline.durhamregiontransit.com/gtfsrealtime/TripUpdates";
const GTFS_REALTIME_VEHICLE_POSITIONS_URL =
  "https://drtonline.durhamregiontransit.com/gtfsrealtime/VehiclePositions";

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

// Cache duration - 1 hour for static data
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

// Function to get real-time trip updates
async function getRealtimeTripUpdates() {
  try {
    console.log("Attempting to fetch real-time updates...");
    const response = await axios.get(GTFS_REALTIME_TRIP_UPDATES_URL, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        Accept: "application/x-protobuf",
        "User-Agent": "DRTime/1.0",
        "Cache-Control": "no-cache",
      },
      validateStatus: (status) => status === 200,
    });

    if (!response.data || response.data.length === 0) {
      console.log("No real-time updates available");
      return [];
    }

    console.log(`Received ${response.data.length} bytes of real-time data`);

    try {
      // Convert ArrayBuffer to Uint8Array for protocol buffer decoding
      const buffer = new Uint8Array(response.data);
      const feed =
        GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);

      if (!feed.entity || feed.entity.length === 0) {
        console.log("No entities in real-time feed");
        return [];
      }

      // Log the first entity for debugging
      if (feed.entity[0]) {
        console.log("Sample entity:", {
          id: feed.entity[0].id,
          tripUpdate: feed.entity[0].tripUpdate
            ? {
                tripId: feed.entity[0].tripUpdate.trip?.tripId,
                stopTimeUpdate:
                  feed.entity[0].tripUpdate.stopTimeUpdate?.length,
              }
            : null,
        });
      }

      console.log(
        `Successfully decoded ${feed.entity.length} real-time updates`
      );
      return feed.entity;
    } catch (decodeError) {
      console.error("Error decoding real-time data:", decodeError);
      return [];
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Failed to fetch real-time updates:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        url: GTFS_REALTIME_TRIP_UPDATES_URL,
      });
    } else {
      console.error("Failed to fetch real-time updates:", error);
    }
    return [];
  }
}

// Helper function to get upcoming arrivals with real-time data
async function getUpcomingArrivals(
  stopId: string,
  gtfsData: GtfsCache
): Promise<any[]> {
  const now = new Date();
  const upcoming: any[] = [];

  try {
    // Get real-time updates with timeout and fallback to empty array if it fails
    const realtimeUpdates = await Promise.race([
      getRealtimeTripUpdates(),
      new Promise<any[]>((resolve) =>
        setTimeout(() => {
          console.log("Real-time updates timed out, using static schedule");
          resolve([]);
        }, 5000)
      ),
    ]);

    // Get all stop times for this stop
    const stopTimes = gtfsData.stopTimes.filter((st) => st.stop_id === stopId);

    for (const st of stopTimes) {
      const trip = gtfsData.trips.find((t) => t.trip_id === st.trip_id);
      if (!trip) continue;

      const route = gtfsData.routes.find((r) => r.route_id === trip.route_id);
      if (!route) continue;

      // Check for real-time updates for this trip
      const realtimeUpdate = realtimeUpdates.find(
        (entity: any) => entity.tripUpdate?.trip?.tripId === st.trip_id
      );

      let arrivalTime = parseGtfsTime(st.arrival_time);
      let departureTime = parseGtfsTime(st.departure_time);
      let isRealtime = false;
      let delayMinutes = 0;

      if (realtimeUpdate?.tripUpdate?.stopTimeUpdate) {
        const stopUpdate = realtimeUpdate.tripUpdate.stopTimeUpdate.find(
          (update: any) => update.stopId === stopId
        );

        if (stopUpdate) {
          if (stopUpdate.arrival?.time) {
            const timestamp = stopUpdate.arrival.time;
            const realtimeArrival = new Date(
              typeof timestamp === "number"
                ? timestamp * 1000
                : timestamp.low * 1000
            );
            delayMinutes = Math.round(
              (realtimeArrival.getTime() - arrivalTime.getTime()) / 60000
            );
            arrivalTime = realtimeArrival;
            isRealtime = true;
          }

          if (stopUpdate.departure?.time) {
            const timestamp = stopUpdate.departure.time;
            departureTime = new Date(
              typeof timestamp === "number"
                ? timestamp * 1000
                : timestamp.low * 1000
            );
            isRealtime = true;
          }
        }
      }

      // Only include if arrival is in the future (within next 2 hours)
      if (
        arrivalTime > now &&
        arrivalTime.getTime() - now.getTime() <= 7200000
      ) {
        upcoming.push({
          routeId: route.route_id,
          routeName: route.route_short_name,
          headsign: trip.trip_headsign,
          scheduledArrival: arrivalTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          minutesUntilArrival: Math.round(
            (arrivalTime.getTime() - now.getTime()) / 60000
          ),
          isRealtime: isRealtime,
          delayMinutes: delayMinutes,
        });
      }
    }

    // Sort by arrival time and limit to next 5 arrivals
    return upcoming
      .sort((a, b) => a.minutesUntilArrival - b.minutesUntilArrival)
      .slice(0, 5);
  } catch (error) {
    console.error("Error getting upcoming arrivals:", error);
    return [];
  }
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
    const radius = 10;

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Get GTFS data
    const gtfsData = await downloadAndExtractGTFS();

    // Find nearby stops and get their arrivals
    const nearbyStopsPromises = gtfsData.stops.map(async (stop: any) => {
      const upcomingArrivals = await getUpcomingArrivals(
        stop.stop_id,
        gtfsData
      );

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
    });

    // Wait for all promises to resolve
    const allStops = await Promise.all(nearbyStopsPromises);

    // Filter and sort the resolved stops
    const nearbyStops = allStops
      .filter((stop) => stop.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 60);

    return NextResponse.json({ stops: nearbyStops });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to fetch nearby stops" },
      { status: 500 }
    );
  }
}
