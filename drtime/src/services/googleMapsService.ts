/**
 * Google Maps Service
 * Provides utility functions for Google Maps integration.
 * Handles location-based features and place suggestions.
 *
 * Features:
 * - Current location detection
 * - Place autocomplete suggestions
 * - Location search functionality
 * - Canadian region restrictions
 */

/**
 * Gets the user's current location using the browser's geolocation API
 * @returns Promise resolving to latitude and longitude coordinates
 * @throws Error if geolocation is not supported or permission is denied
 */
export async function getCurrentLocation(): Promise<{
  lat: number;
  lng: number;
}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}

/**
 * Gets place suggestions for the autocomplete feature
 * @param input Search text input from the user
 * @returns Array of place suggestions with descriptions and place IDs
 * @throws Error if Google Maps API is not loaded or fails
 */
export async function getPlaceSuggestions(input: string) {
  if (!input || !window.google) return [];

  try {
    const service = new google.maps.places.AutocompleteService();
    const response = await service.getPlacePredictions({
      input,
      componentRestrictions: { country: "ca" }, // Restrict to Canadian locations
      types: ["geocode", "establishment"], // Include addresses and points of interest
      region: "ca", // Set region bias to Canada
    });

    return response.predictions.map((prediction) => ({
      description: prediction.description,
      place_id: prediction.place_id,
    }));
  } catch (error) {
    console.error("Error getting place suggestions:", error);
    return [];
  }
}
