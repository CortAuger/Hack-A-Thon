import { NextResponse } from "next/server";
import axios from "axios";
import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";

// GTFS data types
interface Route {
  route_id: string;
  route_name: string;
  route_type: string;
  route_color: string;
  route_text_color: string;
}

interface Stop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  wheelchair_boarding: string;
}

// Process GTFS static data from ZIP file
async function processGTFSStatic() {
  try {
    const url = process.env.GTFS_STATIC_URL;
    if (!url) {
      throw new Error("GTFS_STATIC_URL environment variable is not set");
    }

    // Download and process the ZIP file
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });

    const zip = new AdmZip(response.data);
    const routes: Route[] = [];
    const stops: Stop[] = [];

    // Process routes.txt
    const routesFile = zip.getEntry("routes.txt");
    if (routesFile) {
      const routesContent = routesFile.getData().toString("utf-8");
      const routesRecords = parse(routesContent, {
        columns: true,
        skip_empty_lines: true,
      });
      routes.push(...routesRecords);
    }

    // Process stops.txt
    const stopsFile = zip.getEntry("stops.txt");
    if (stopsFile) {
      const stopsContent = stopsFile.getData().toString("utf-8");
      const stopsRecords = parse(stopsContent, {
        columns: true,
        skip_empty_lines: true,
      });
      stops.push(...stopsRecords);
    }

    return {
      routes,
      stops,
    };
  } catch (error) {
    console.error("Error processing GTFS static data:", error);
    throw error;
  }
}

// GET handler for GTFS static data
export async function GET() {
  try {
    const data = await processGTFSStatic();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GTFS API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process GTFS static data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
