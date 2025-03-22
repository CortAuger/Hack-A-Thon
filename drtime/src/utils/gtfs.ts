import axios from "axios";

export interface BusLocation {
  id: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: number;
}

export interface Route {
  id: string;
  name: string;
  color: string;
}

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  routes: string[];
}

export class GTFSManager {
  private static instance: GTFSManager;
  private routes: Map<string, Route> = new Map();
  private stops: Map<string, Stop> = new Map();
  private lastUpdate: number = 0;
  private updateInterval: number = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): GTFSManager {
    if (!GTFSManager.instance) {
      GTFSManager.instance = new GTFSManager();
    }
    return GTFSManager.instance;
  }

  async initialize() {
    await this.loadStaticData();
    this.startRealtimeUpdates();
  }

  private async loadStaticData() {
    try {
      const response = await axios.get("/api/gtfs");
      const { routes, stops } = response.data;

      // Update routes
      routes.forEach((route: Route) => {
        this.routes.set(route.id, route);
      });

      // Update stops
      stops.forEach((stop: Stop) => {
        this.stops.set(stop.id, stop);
      });
    } catch (error) {
      console.error("Error loading GTFS static data:", error);
    }
  }

  private async startRealtimeUpdates() {
    setInterval(async () => {
      await this.updateRealtimeData();
    }, this.updateInterval);
  }

  private async updateRealtimeData() {
    try {
      const response = await axios.get("/api/gtfs/realtime");
      const vehiclePositions = response.data;
      this.lastUpdate = Date.now();

      // Process vehicle positions
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
      // Don't throw the error to prevent the update loop from breaking
    }
  }

  getRoutes(): Route[] {
    return Array.from(this.routes.values());
  }

  getStops(): Stop[] {
    return Array.from(this.stops.values());
  }

  getRouteById(id: string): Route | undefined {
    return this.routes.get(id);
  }

  getStopById(id: string): Stop | undefined {
    return this.stops.get(id);
  }
}
