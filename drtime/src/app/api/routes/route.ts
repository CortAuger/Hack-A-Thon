import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { origin, destination } = await request.json();

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Origin and destination are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch directions");
    }

    const data = await response.json();

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
