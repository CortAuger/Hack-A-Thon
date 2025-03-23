/**
 * GTFS Manager Module
 * Manages transit data using the General Transit Feed Specification (GTFS).
 * Handles both static and real-time transit data.
 *
 * Features:
 * - Static GTFS data management (routes, stops)
 * - Real-time updates for vehicle positions
 * - Singleton pattern implementation
 * - Automatic data refresh
 */

import axios from "axios";

/**
 * Interface for bus location data
 * Contains real-time position information for a bus
 */
export interface BusLocation {
  id: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: number;
}

/**
 * Interface for route information
 * Contains basic route details
 */
export interface Route {
  id: string;
  name: string;
  color: string;
}

/**
 * Interface for bus stop information
 * Contains location and associated routes
 */
export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  routes: string[];
}

/**
 * GTFSManager Class
 * Singleton class that manages all GTFS data operations
 */
export class GTFSManager {
  private static instance: GTFSManager;
  private routes: Map<string, Route> = new Map();
  private stops: Map<string, Stop> = new Map();
  private lastUpdate: number = 0;
  private updateInterval: number = 30000; // 30 seconds refresh interval

  private constructor() {}

  /**
   * Gets the singleton instance of GTFSManager
   * Creates a new instance if one doesn't exist
   */
  static getInstance(): GTFSManager {
    if (!GTFSManager.instance) {
      GTFSManager.instance = new GTFSManager();
    }
    return GTFSManager.instance;
  }

  /**
   * Initializes the GTFS manager
   * Loads static data and starts real-time updates
   */
  async initialize() {
    await this.loadStaticData();
    this.startRealtimeUpdates();
  }

  /**
   * Loads static GTFS data (routes and stops)
   * Updates internal data stores with fetched information
   */
  private async loadStaticData() {
    try {
      const response = await axios.get("/api/gtfs");
      const { routes, stops } = response.data;

      // Update routes data
      routes.forEach((route: Route) => {
        this.routes.set(route.id, route);
      });

      // Update stops data
      stops.forEach((stop: Stop) => {
        this.stops.set(stop.id, stop);
      });
    } catch (error) {
      console.error("Error loading GTFS static data:", error);
    }
  }

  /**
   * Starts periodic real-time data updates
   * Updates vehicle positions at regular intervals
   */
  private async startRealtimeUpdates() {
    setInterval(async () => {
      await this.updateRealtimeData();
    }, this.updateInterval);
  }

  /**
   * Updates real-time vehicle position data
   * Handles data validation and error logging
   */
  private async updateRealtimeData() {
    try {
      const response = await axios.get("/api/gtfs/realtime");
      const vehiclePositions = response.data;
      this.lastUpdate = Date.now();

      // Process and validate vehicle positions
      if (Array.isArray(vehiclePositions)) {
        vehiclePositions.forEach((vehicle: BusLocation) => {
          // Update vehicle positions in your state management system
        });
      } else {
        console.warn(
          "Invalid vehicle positions data format:",
          vehiclePositions
        );
      }
    } catch (error) {
      console.error("Error updating realtime data:", error);
      if (axios.isAxiosError(error)) {
        console.error("Error details:", error.response?.data);
      }
    }
  }

  /**
   * Gets all available routes
   * @returns Array of all routes
   */
  getRoutes(): Route[] {
    return Array.from(this.routes.values());
  }

  /**
   * Gets all available stops
   * @returns Array of all stops
   */
  getStops(): Stop[] {
    return Array.from(this.stops.values());
  }

  /**
   * Gets a specific route by ID
   * @param id Route ID to look up
   * @returns Route information or undefined if not found
   */
  getRouteById(id: string): Route | undefined {
    return this.routes.get(id);
  }

  /**
   * Gets a specific stop by ID
   * @param id Stop ID to look up
   * @returns Stop information or undefined if not found
   */
  getStopById(id: string): Stop | undefined {
    return this.stops.get(id);
  }
}
