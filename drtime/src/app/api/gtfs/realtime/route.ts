import { NextResponse } from "next/server";
import axios from "axios";
import * as GtfsRealtimeBindings from "gtfs-realtime-bindings";

interface VehiclePosition {
  id: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: number;
}

interface TripUpdate {
  tripId: string;
  routeId: string;
  stopId: string;
  arrivalTime: number;
  departureTime: number;
  status: string;
}

interface GtfsEntity {
  vehicle?: {
    vehicle?: {
      id?: string;
    };
    trip?: {
      routeId?: string;
    };
    position?: {
      latitude?: number;
      longitude?: number;
      speed?: number;
    };
    timestamp?: {
      low?: number;
    };
  };
  tripUpdate?: {
    trip?: {
      tripId?: string;
      routeId?: string;
    };
    stopTimeUpdate?: Array<{
      stopId?: string;
      arrival?: {
        time?: {
          low?: number;
        };
      };
      departure?: {
        time?: {
          low?: number;
        };
      };
      scheduleRelationship?: string;
    }>;
  };
}

// Process GTFS real-time data
async function processGTFSRealtime() {
  try {
    const tripUpdatesUrl =
      "https://drtonline.durhamregiontransit.com/gtfsrealtime/TripUpdates";
    const vehiclePositionsUrl =
      "https://drtonline.durhamregiontransit.com/gtfsrealtime/VehiclePositions";
    const alertsUrl = "https://maps.durham.ca/OpenDataGTFS/alerts.pb";

    // Common headers for protobuf requests
    const headers = {
      Accept: "application/x-protobuf",
    };

    // Fetch vehicle positions
    const vehiclePositionsResponse = await axios.get(vehiclePositionsUrl, {
      responseType: "arraybuffer",
      headers,
    });

    // Fetch trip updates
    const tripUpdatesResponse = await axios.get(tripUpdatesUrl, {
      responseType: "arraybuffer",
      headers,
    });

    // Process vehicle positions
    const vehiclePositionsFeed =
      GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(vehiclePositionsResponse.data)
      );
    const vehiclePositions: VehiclePosition[] = (
      vehiclePositionsFeed as any
    ).entity
      .filter((entity: GtfsEntity) => entity.vehicle && entity.vehicle.position)
      .map((entity: GtfsEntity) => ({
        id: entity.vehicle?.vehicle?.id || "",
        routeId: entity.vehicle?.trip?.routeId || "",
        latitude: entity.vehicle?.position?.latitude || 0,
        longitude: entity.vehicle?.position?.longitude || 0,
        speed: entity.vehicle?.position?.speed || 0,
        timestamp: entity.vehicle?.timestamp?.low || Date.now(),
      }));

    // Process trip updates
    const tripUpdatesFeed =
      GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(tripUpdatesResponse.data)
      );
    const tripUpdates: TripUpdate[] = (tripUpdatesFeed as any).entity
      .filter((entity: GtfsEntity) => entity.tripUpdate)
      .map((entity: GtfsEntity) => ({
        tripId: entity.tripUpdate?.trip?.tripId || "",
        routeId: entity.tripUpdate?.trip?.routeId || "",
        stopId: entity.tripUpdate?.stopTimeUpdate?.[0]?.stopId || "",
        arrivalTime:
          entity.tripUpdate?.stopTimeUpdate?.[0]?.arrival?.time?.low || 0,
        departureTime:
          entity.tripUpdate?.stopTimeUpdate?.[0]?.departure?.time?.low || 0,
        status:
          entity.tripUpdate?.stopTimeUpdate?.[0]?.scheduleRelationship ||
          "scheduled",
      }));

    return {
      vehiclePositions,
      tripUpdates,
    };
  } catch (error) {
    console.error("Error processing GTFS real-time data:", error);
    if (axios.isAxiosError(error)) {
      console.error("API Error Details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
    throw error;
  }
}

// GET handler for GTFS real-time data
export async function GET() {
  try {
    const data = await processGTFSRealtime();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GTFS realtime API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process GTFS real-time data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
