"use client";
import L from "leaflet";
/**
 * Sources used: chatGPT-o4
 * Prompted used: How do I integrate Leaflet with Next.js and get track details on the map.
 */
 
 
import dynamic from "next/dynamic";
import { useEffect, useState, useMemo, memo } from "react";
import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";
 

// Dynamic imports for Leaflet components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const GeoJSON = dynamic(
  () => import("react-leaflet").then((mod) => mod.GeoJSON),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

 
// Ensure Leaflet is only loaded on the client side
// const isClient = typeof window !== "undefined";
 
 
// Default map center (Alberta)
const DEFAULT_POSITION: [number, number] = [51.0447, -114.0719];

interface RailwayMapProps {
  onFeatureSelect: (feature: any) => void;
}

const RailwayMap = ({ onFeatureSelect }: RailwayMapProps) => {
  const [railwayData, setRailwayData] = useState<any>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const router = useRouter();
 
  useEffect(() => {
    console.log("RailwayMap mounted.");
  }, []);
 
  // Fetch the GeoJSON data
  useEffect(() => {
    fetch("/Alberta.geojson")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch GeoJSON data");
        return response.json();
      })
      .then((data) => {
        setRailwayData(data);
        setIsLoading(false);
        setError(null);
      })
      .catch((error) => {
        console.error("Error fetching GeoJSON data:", error);
        setIsLoading(false);
        setError("Failed to load railway data. Please try again later.");
      });
  }, []);
 
 
  // Function to get the midpoint of a geometry
  const getMidpoint = (geometry: any): [number, number] => {
    if (!geometry || !geometry.coordinates) return DEFAULT_POSITION;
 
    if (geometry.type === "LineString") {
      const coords = geometry.coordinates;
      if (coords.length === 0) return DEFAULT_POSITION;
      const midIndex = Math.floor(coords.length / 2);
      return [coords[midIndex][1], coords[midIndex][0]];
    }
 
    if (geometry.type === "MultiLineString") {
      const firstLine = geometry.coordinates[0];
      if (!firstLine || firstLine.length === 0) return DEFAULT_POSITION;
      const midIndex = Math.floor(firstLine.length / 2);
      return [firstLine[midIndex][1], firstLine[midIndex][0]];
    }
 
    if (geometry.type === "Point") {
      return [geometry.coordinates[1], geometry.coordinates[0]];
    }
 
    console.warn("Unknown geometry type:", geometry.type);
    return DEFAULT_POSITION;
  };
 
  // Function to style the railway lines
  const railwayStyle = (feature: any) => {
    return {
      color:
        selectedFeature &&
          selectedFeature.properties["@id"] === feature.properties["@id"]
          ? "#ed9e1f"
          : "#2b35f0",
      weight: 3,
      opacity: 0.8,
    };
  };
 
  // Function to handle feature click
  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      click: () => {
        setSelectedFeature(feature);
        onFeatureSelect(feature);
      },
    });
  };
 
  
  // Custom pointToLayer to prevent [object Object] bug from default leaflet markers
  const pointToLayer = (feature: any, latlng: any) => {
    // L is imported at top
    const customIcon = new L.Icon({
      iconUrl: '/leaflet/marker-icon.png',
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      shadowUrl: '/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    return L.marker(latlng, { icon: customIcon });
  };

  // Memoized GeoJSON layer
  const geoJsonLayer = useMemo(() => {
    if (
      !railwayData ||
      !railwayData.features ||
      railwayData.features.length === 0
    ) {
      return null;
    }
    return (
      <GeoJSON
        data={railwayData}
        style={railwayStyle}
        onEachFeature={onEachFeature}
        pointToLayer={pointToLayer}
      />
    );
  }, [railwayData, selectedFeature]);
 
  // Render the map and popups
  return (
    <div
      className="relative flex flex-col h-full min-h-0 bg-[#1e2128] shadow-lg shadow-black/20 rounded-xl flex-grow hover:cursor-pointer overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      >
      {isLoading && <div className="loading-spinner">Loading...</div>}
      {error && <div className="error-message">{error}</div>}
      {!isLoading && !error && (
        <MapContainer
          center={DEFAULT_POSITION}
          zoom={10}
          zoomControl={false}
          preferCanvas={true}
          attributionControl={false}
          style={{
            height: "100%",
            width: "100%",
            borderRadius: "12px",
            zIndex: "0",
          }}
          aria-label="Railway Map"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          />
          {geoJsonLayer}
          {selectedFeature && selectedFeature.geometry && (
            <Popup
              position={getMidpoint(selectedFeature.geometry)}
              eventHandlers={{ remove: () => setSelectedFeature(null) }}
            >
              <div>
                <h3>Railway Details</h3>
                <ul>
                  {Object.entries(selectedFeature.properties).map(
                    ([key, value]) => (
                      <li key={key}>
                        <strong>{key}:</strong> {String(value)}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </Popup>
          )}
        </MapContainer>
      )}
      {isHovered && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-black text-white text-md px-2 py-1 rounded shadow-md z-10">
          Interactive railway map for monitoring routes.
        </div>
      )}
    </div>
  );
};
 
export default memo(RailwayMap);
 