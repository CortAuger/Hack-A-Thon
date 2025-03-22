import { NextResponse } from "next/server";
import axios from "axios";
import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";

const GTFS_STATIC_URL =
  "https://maps.durham.ca/OpenDataGTFS/GTFS_Durham_TXT.zip";

// Interface definitions for GTFS data structures
interface Stop {
  stop_id: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
}

interface StopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
}

interface Trip {
  route_id: string;
  trip_id: string;
  trip_headsign: string;
  direction_id: string;
}

export async function GET(
  request: Request,
  { params }: { params: { routeId: string } }
) {
  try {
    const routeId = params.routeId;
    // Fetch GTFS data from Durham Transit
    const response = await axios.get(GTFS_STATIC_URL, {
      responseType: "arraybuffer",
      timeout: 10000,
    });

    const zip = new AdmZip(response.data);

    // Parse trips.txt to get route trip information
    const tripsEntry = zip.getEntry("trips.txt");
    if (!tripsEntry) throw new Error("trips.txt not found");
    const trips: Trip[] = parse(tripsEntry.getData().toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
    });

    // Filter trips for the requested route
    const routeTrips = trips.filter((trip) => trip.route_id === routeId);
    if (routeTrips.length === 0) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    // Parse stop_times.txt to get timing information
    const stopTimesEntry = zip.getEntry("stop_times.txt");
    if (!stopTimesEntry) throw new Error("stop_times.txt not found");
    const stopTimes: StopTime[] = parse(
      stopTimesEntry.getData().toString("utf8"),
      {
        columns: true,
        skip_empty_lines: true,
      }
    );

    // Parse stops.txt to get stop location information
    const stopsEntry = zip.getEntry("stops.txt");
    if (!stopsEntry) throw new Error("stops.txt not found");
    const stops: Stop[] = parse(stopsEntry.getData().toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
    });

    // Use the first trip as a representative for the route's stop sequence
    const representativeTrip = routeTrips[0];

    // Get ordered stop sequence for the representative trip
    const tripStopTimes = stopTimes
      .filter((st) => st.trip_id === representativeTrip.trip_id)
      .sort((a, b) => a.stop_sequence - b.stop_sequence);

    // Build detailed stop information for each stop in sequence
    const stopSequence = tripStopTimes.map((st) => {
      const stop = stops.find((s) => s.stop_id === st.stop_id);
      return {
        stop_id: st.stop_id,
        stop_name: stop?.stop_name || "",
        stop_lat: stop?.stop_lat || "",
        stop_lon: stop?.stop_lon || "",
        arrival_time: st.arrival_time,
        departure_time: st.departure_time,
      };
    });

    // Extract unique route directions from trip headsigns
    const directions = Array.from(
      new Set(routeTrips.map((trip) => trip.trip_headsign))
    );

    // Return complete route information
    return NextResponse.json({
      route_id: routeId,
      directions,
      stops: stopSequence,
      total_trips: routeTrips.length,
    });
  } catch (error) {
    console.error("Error fetching route details:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch route details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
