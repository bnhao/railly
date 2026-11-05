"use client";
import L from "leaflet";
import dynamic from "next/dynamic";
import { useEffect, useState, useMemo, useRef, useCallback, memo } from "react";
import "leaflet/dist/leaflet.css";
import { getRailwayGeoJSON, getCachedRailwayGeoJSON } from "@/utils/railwayDataCache";

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

// Default map center (Alberta)
const DEFAULT_POSITION: [number, number] = [51.0447, -114.0719];

interface RailwayMapProps {
  onFeatureSelect: (feature: any) => void;
}

const RailwayMap = ({ onFeatureSelect }: RailwayMapProps) => {
  const [railwayData, setRailwayData] = useState<any>(() => getCachedRailwayGeoJSON());
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !getCachedRailwayGeoJSON());
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const selectedLayerRef = useRef<any>(null);

  // Dedicated hardware-accelerated Canvas renderer for 60fps smooth zooming
  const canvasRenderer = useMemo(() => {
    if (typeof window === "undefined") return null;
    return L.canvas({ padding: 0.5, tolerance: 10 });
  }, []);

  // Fetch the GeoJSON data once using shared memory cache
  useEffect(() => {
    const existing = getCachedRailwayGeoJSON();
    if (existing) {
      setRailwayData(existing);
      setIsLoading(false);
      return;
    }

    getRailwayGeoJSON()
      .then((data) => {
        setRailwayData(data);
        setIsLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching GeoJSON data:", err);
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

    return DEFAULT_POSITION;
  };

  // Base styling for railway lines with canvas renderer
  const railwayStyle = useMemo(() => {
    return () => ({
      color: "#2b35f0",
      weight: 2.5,
      opacity: 0.8,
      renderer: canvasRenderer || undefined,
    });
  }, [canvasRenderer]);

  // Helper to reset styling of previous selected layer
  const resetLayerStyle = useCallback((layer: any) => {
    if (!layer) return;
    try {
      const feature = layer.feature;
      if (feature?.geometry?.type === "Point") {
        const isStation = feature.properties?.railway === "station";
        layer.setStyle({
          radius: isStation ? 7 : 5,
          fillColor: isStation ? "#f59e0b" : "#06b6d4",
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.95,
        });
      } else {
        layer.setStyle({
          color: "#2b35f0",
          weight: 2.5,
          opacity: 0.8,
        });
      }
    } catch {
      // Ignore if unmounted
    }
  }, []);

  // Handle feature click directly on the layer to avoid re-rendering
  const onEachFeature = useCallback(
    (feature: any, layer: any) => {
      // Add hover tooltip for stations/stops
      if (feature.geometry?.type === "Point" && feature.properties?.name) {
        layer.bindTooltip(
          `<div class="font-semibold text-xs text-gray-900">${feature.properties.name}</div><div class="text-[10px] text-gray-500">${feature.properties.railway === "station" ? "Station" : "Stop"}</div>`,
          { direction: "top", offset: [0, -6], opacity: 0.95 }
        );
      }

      layer.on({
        click: () => {
          // Reset previous selected layer style without unmounting GeoJSON
          if (selectedLayerRef.current && selectedLayerRef.current !== layer) {
            resetLayerStyle(selectedLayerRef.current);
          }

          // Highlight the clicked layer
          try {
            if (feature.geometry?.type === "Point") {
              layer.setStyle({
                radius: 9,
                fillColor: "#ef4444",
                color: "#ffffff",
                weight: 3,
                fillOpacity: 1,
              });
            } else {
              layer.setStyle({
                color: "#ed9e1f",
                weight: 4.5,
                opacity: 1,
              });
            }
          } catch {
            // Ignore
          }

          selectedLayerRef.current = layer;
          setSelectedFeature(feature);
          onFeatureSelect(feature);
        },
      });
    },
    [onFeatureSelect, resetLayerStyle]
  );

  // Render stations/stops as high-performance Canvas circle markers
  const pointToLayer = useCallback(
    (feature: any, latlng: any) => {
      const isStation = feature.properties?.railway === "station";
      return L.circleMarker(latlng, {
        renderer: canvasRenderer || undefined,
        radius: isStation ? 7 : 5,
        fillColor: isStation ? "#f59e0b" : "#06b6d4", // amber for stations, cyan for stops
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95,
      });
    },
    [canvasRenderer]
  );

  // Client-side filter to only render railway lines and meaningful stations/stops
  const filterFeature = useCallback((feature: any) => {
    if (!feature || !feature.geometry) return false;
    const type = feature.geometry.type;
    if (type === "LineString" || type === "MultiLineString") return true;
    if (type === "Point") {
      const p = feature.properties || {};
      return (
        p.railway === "station" ||
        p.railway === "stop" ||
        (p.name && p.railway !== "switch" && p.railway !== "level_crossing" && p.railway !== "signal")
      );
    }
    return false;
  }, []);

  // Memoized GeoJSON layer - does NOT depend on selectedFeature, preventing massive re-renders
  const geoJsonLayer = useMemo(() => {
    if (!railwayData || !railwayData.features || railwayData.features.length === 0) {
      return null;
    }
    return (
      <GeoJSON
        data={railwayData}
        style={railwayStyle}
        onEachFeature={onEachFeature}
        pointToLayer={pointToLayer}
        filter={filterFeature}
      />
    );
  }, [railwayData, railwayStyle, onEachFeature, pointToLayer, filterFeature]);

  // Render the map and popups
  return (
    <div
      className="relative flex flex-col h-full min-h-0 bg-[#1e2128] shadow-lg shadow-black/20 rounded-xl flex-grow hover:cursor-pointer overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isLoading && (
        <div className="flex items-center justify-center h-full text-cyan-400 font-mono text-sm animate-pulse">
          Loading Railway Telemetry...
        </div>
      )}
      {error && <div className="p-4 text-rose-400 text-sm">{error}</div>}
      {!isLoading && !error && (
        <MapContainer
          center={DEFAULT_POSITION}
          zoom={10}
          zoomControl={false}
          preferCanvas={true}
          wheelDebounceTime={100}
          wheelPxPerZoomLevel={120}
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
              eventHandlers={{
                remove: () => {
                  if (selectedLayerRef.current) {
                    resetLayerStyle(selectedLayerRef.current);
                    selectedLayerRef.current = null;
                  }
                  setSelectedFeature(null);
                },
              }}
            >
              <div>
                <h3 className="font-bold text-gray-900">
                  {selectedFeature.geometry.type === "Point"
                    ? selectedFeature.properties?.name || "Station Details"
                    : "Railway Details"}
                </h3>
                <ul className="text-xs space-y-1 mt-1 text-gray-700">
                  {Object.entries(selectedFeature.properties).map(([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {String(value)}
                    </li>
                  ))}
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
