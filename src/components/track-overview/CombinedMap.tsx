"use client";
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { trackCoordinates } from "@/data/trackLocations";

interface CombinedMapProps {
  selectedTrack: string;
}

const CombinedMap: React.FC<CombinedMapProps> = ({ selectedTrack }) => {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Ensure this code only runs in the
    if (typeof window === "undefined") return;

    // Dynamically import the Google Mutant plugin
    import("leaflet.gridlayer.googlemutant").then((googleMutant) => {
      // Initialize the map
      mapRef.current = L.map("combined-map").setView(
        trackCoordinates[selectedTrack] || { lat: 51.0447, lng: -114.0719 }, // Default to Calgary
        10
      );

      // Add Google Maps layer
      const googleLayer = (googleMutant as any).googleMutant({
        type: "roadmap", // Options: roadmap, satellite, terrain, hybrid
      });
      googleLayer.addTo(mapRef.current);

      // Add railway WMS layer
      L.tileLayer
        .wms("https://maps.geogratis.gc.ca/wms/railway_en?", {
          layers: "railway.track",
          format: "image/png",
          transparent: true,
          attribution:
            "Map data © <a href='https://open.canada.ca/'>Government of Canada</a>",
        })
        .addTo(mapRef.current);
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [selectedTrack]);

  return (
    <div
      id="combined-map"
      style={{ height: "100%", width: "100%", borderRadius: "10px" }}
    ></div>
  );
};

export default CombinedMap;
