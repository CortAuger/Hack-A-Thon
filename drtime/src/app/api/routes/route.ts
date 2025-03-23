/**
 * Routes API Router
 * This API endpoint handles route calculations between two points using Google Maps Directions API.
 * It serves as a proxy to protect API keys and handle route calculations server-side.
 *
 * Features:
 * - Calculates routes between origin and destination coordinates
 * - Uses Google Maps Directions API for accurate routing
 * - Handles error cases and invalid inputs
 * - Returns formatted directions data
 */

import { NextResponse } from "next/server";

/**
 * POST handler for route calculations
 * @param request Request object containing origin and destination coordinates
 * @returns Directions data from Google Maps API or error response
 */
export async function POST(request: Request) {
  try {
    const { origin, destination } = await request.json();

    // Validate required parameters
    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Origin and destination are required" },
        { status: 400 }
      );
    }

    // Call Google Maps Directions API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch directions");
    }

    const data = await response.json();

    // Check if the route was successfully calculated
    if (data.status !== "OK") {
      return NextResponse.json({ error: data.status }, { status: 400 });
    }

    return NextResponse.json({ directions: data });
  } catch (error) {
    console.error("Error in routes API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
