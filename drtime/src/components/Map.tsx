"use client";

import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import GoogleMapsProvider from "./GoogleMapsProvider";

const mapContainerStyle = {
  width: "100%",
  height: "70vh",
};

const defaultCenter = {
  lat: 43.9441274,
  lng: -78.8945614,
};

export default function Map() {
  return (
    <GoogleMapsProvider>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={14}
        options={{
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      >
        <Marker position={defaultCenter} />
      </GoogleMap>
    </GoogleMapsProvider>
  );
}
