import { NextResponse } from "next/server";
import axios from "axios";
import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";

const GTFS_STATIC_URL = "https://www.durhamregiontransit.com/gtfs/gtfs.zip";

// Cache for routes data
let routesCache: any[] | null = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

async function loadRoutes() {
  try {
    // Return cached data if available and not expired
    if (routesCache && Date.now() - lastCacheUpdate < CACHE_DURATION) {
      return routesCache;
    }

    console.log("Fetching GTFS routes data...");
    const response = await axios.get(GTFS_STATIC_URL, {
      responseType: "arraybuffer",
    });

    const zip = new AdmZip(response.data);
    const routesFile = zip.getEntry("routes.txt");

    if (!routesFile) {
      throw new Error("routes.txt not found in GTFS data");
    }

    const routesContent = routesFile.getData().toString("utf-8");
    const routes = parse(routesContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Sort routes by route_short_name
    routes.sort((a: any, b: any) => {
      const aNum = parseInt(a.route_short_name);
      const bNum = parseInt(b.route_short_name);
      return aNum - bNum;
    });

    // Update cache
    routesCache = routes;
    lastCacheUpdate = Date.now();
    console.log("Routes data loaded successfully");
    return routes;
  } catch (error) {
    console.error("Error loading routes data:", error);
    throw error;
  }
}

export async function GET() {
  try {
    const routes = await loadRoutes();
    return NextResponse.json({ routes });
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
