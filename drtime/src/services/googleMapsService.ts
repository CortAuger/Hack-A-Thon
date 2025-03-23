// Get current location
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

// Get place suggestions for autocomplete
export async function getPlaceSuggestions(input: string) {
  if (!input || !window.google) return [];

  try {
    const service = new google.maps.places.AutocompleteService();
    const response = await service.getPlacePredictions({
      input,
      componentRestrictions: { country: "ca" },
      types: ["geocode", "establishment"],
      region: "ca",
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
