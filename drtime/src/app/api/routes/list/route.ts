/**
 * Routes List API Router
 * This API endpoint provides a comprehensive list of all bus routes in the Durham Region Transit system.
 * It processes GTFS static data to provide detailed information about each route.
 *
 * Features:
 * - Lists all available bus routes with their details
 * - Provides route colors for UI display
 * - Includes trip and stop counts for each route
 * - Implements caching to improve performance
 */

import { NextResponse } from "next/server";
import axios from "axios";
import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";

const GTFS_STATIC_URL =
  "https://maps.durham.ca/OpenDataGTFS/GTFS_Durham_TXT.zip";

/**
 * Cache configuration for routes data
 * Data is cached for 1 hour to reduce load on GTFS server
 */
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
let routesCache: {
  data: RouteInfo[];
  timestamp: number;
} | null = null;

/**
 * Interface defining the structure of route information
 * Includes basic route details and statistics
 */
interface RouteInfo {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: string;
  route_color: string;
  route_text_color: string;
  trips_count: number;
  stops_count: number;
}

/**
 * Fetches and processes route information from GTFS static data
 * Combines data from routes.txt, trips.txt, and stop_times.txt
 * @returns Array of processed route information
 */
async function fetchAndProcessRoutes() {
  try {
    // Return cached data if available and not expired
    if (routesCache && Date.now() - routesCache.timestamp < CACHE_DURATION) {
      return routesCache.data;
    }

    console.log("Fetching GTFS data...");
    const response = await axios.get(GTFS_STATIC_URL, {
      responseType: "arraybuffer",
      timeout: 10000,
    });

    const zip = new AdmZip(response.data);

    // Read and parse routes.txt
    const routesEntry = zip.getEntry("routes.txt");
    if (!routesEntry) {
      throw new Error("routes.txt not found in GTFS data");
    }
    const routesData = parse(routesEntry.getData().toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
    });

    // Read and parse trips.txt to count trips per route
    const tripsEntry = zip.getEntry("trips.txt");
    if (!tripsEntry) {
      throw new Error("trips.txt not found in GTFS data");
    }
    const tripsData = parse(tripsEntry.getData().toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
    });

    // Read and parse stop_times.txt to count stops per route
    const stopTimesEntry = zip.getEntry("stop_times.txt");
    if (!stopTimesEntry) {
      throw new Error("stop_times.txt not found in GTFS data");
    }
    const stopTimesData = parse(stopTimesEntry.getData().toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
    });

    // Process routes data
    const routes = routesData.map((route: any) => {
      // Count trips for this route
      const routeTrips = tripsData.filter(
        (trip: any) => trip.route_id === route.route_id
      );

      // Get unique stops for this route
      const routeStops = new Set();
      routeTrips.forEach((trip: any) => {
        const tripStops = stopTimesData
          .filter((st: any) => st.trip_id === trip.trip_id)
          .map((st: any) => st.stop_id);
        tripStops.forEach((stop: string) => routeStops.add(stop));
      });

      return {
        route_id: route.route_id,
        route_short_name: route.route_short_name || "",
        route_long_name: route.route_long_name || "",
        route_type: route.route_type || "3", // 3 is bus
        route_color: route.route_color || "1976D2", // Default blue color
        route_text_color: route.route_text_color || "FFFFFF",
        trips_count: routeTrips.length,
        stops_count: routeStops.size,
      };
    });

    // Sort routes by route number
    routes.sort((a: RouteInfo, b: RouteInfo) => {
      const aNum = parseInt(a.route_short_name) || 0;
      const bNum = parseInt(b.route_short_name) || 0;
      return aNum - bNum;
    });

    // Update cache
    routesCache = {
      data: routes,
      timestamp: Date.now(),
    };

    return routes;
  } catch (error) {
    console.error("Error fetching routes:", error);
    throw error;
  }
}

export async function GET() {
  try {
    const routes = await fetchAndProcessRoutes();
    return NextResponse.json(routes);
  } catch (error) {
    console.error("Routes API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch routes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
