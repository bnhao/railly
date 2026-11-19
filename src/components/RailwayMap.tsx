"use client";
import L from "leaflet";
import type { Geometry } from "geojson";
import { MapContainer, TileLayer, Popup, useMap } from "react-leaflet";
import {
  useEffect,
  useState,
  useRef,
  useCallback,
  memo,
} from "react";
import "leaflet/dist/leaflet.css";
import {
  getMainlineGeoJSON,
  getDetailGeoJSON,
  getCachedMainlineGeoJSON,
  getCachedDetailGeoJSON,
  RailwayFeature,
  RailwayFeatureCollection,
} from "@/utils/railwayDataCache";
import { yieldToMain } from "@/utils/yieldToMain";
import { Task } from "@/types/task";
import {
  formatDateOnly,
  getTodayDateString,
  parseCoordinates,
} from "@/utils/coordinates";

const DEFAULT_POSITION: [number, number] = [51.0447, -114.0719];
const DETAIL_MIN_ZOOM = 11;
const FEATURE_BATCH_SIZE = 160;
const LONG_TASK_BUDGET_MS = 35;

interface StyledFeatureLayer extends L.Path {
  feature?: RailwayFeature;
}

export interface TrackDispatchPayload {
  trackId: string;
  name: string;
  lat: number;
  lon: number;
}

interface RailwayMapProps {
  onFeatureSelect?: (feature: RailwayFeature) => void;
  tasks?: Task[];
  onTaskSelect?: (task: Task) => void;
  focusCoords?: [number, number] | null;
  focusZoom?: number;
  canDispatch?: boolean;
  onDispatchTrack?: (payload: TrackDispatchPayload) => void;
  minHeightClass?: string;
}

function getMidpoint(geometry: Geometry): [number, number] {
  if (!geometry) return DEFAULT_POSITION;

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
}

function resetLayerStyle(layer: StyledFeatureLayer | null): void {
  if (!layer || typeof layer.setStyle !== "function") return;
  try {
    const feature = layer.feature;
    if (feature?.geometry?.type === "Point") {
      const isStation = feature.properties?.railway === "station";
      (layer as L.CircleMarker).setStyle({
        radius: isStation ? 6.5 : 4.5,
        fillColor: isStation ? "#f59e0b" : "#06b6d4",
        color: "#ffffff",
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.95,
      });
    } else {
      layer.setStyle({
        color: "#3b82f6",
        weight: 2.2,
        opacity: 0.78,
      });
    }
  } catch {
    // Ignore unmounted layers
  }
}

function highlightLayerStyle(
  layer: StyledFeatureLayer | null,
  feature: RailwayFeature
): void {
  if (!layer || typeof layer.setStyle !== "function") return;
  try {
    if (feature?.geometry?.type === "Point") {
      (layer as L.CircleMarker).setStyle({
        radius: 8.5,
        fillColor: "#f97316",
        color: "#ffffff",
        weight: 2.5,
        fillOpacity: 1,
      });
    } else {
      layer.setStyle({
        color: "#f59e0b",
        weight: 4.5,
        opacity: 1,
      });
    }
  } catch {
    // Ignore unmounted layers
  }
}

function getTaskMarkerColor(task: Task, today: string): string {
  const statusLower = task.status?.toLowerCase();
  if (statusLower === "completed") return "#10b981"; // Emerald
  const endDate = formatDateOnly(task.end_date);
  const isOverdue = Boolean(endDate && endDate < today);
  if (isOverdue || task.priority?.toLowerCase() === "high") return "#ef4444"; // Rose/Red
  if (statusLower === "in progress") return "#06b6d4"; // Cyan
  return "#f59e0b"; // Amber
}

interface MapViewportControllerProps {
  focusCoords?: [number, number] | null;
  focusZoom?: number;
}

const MapViewportController = memo(function MapViewportController({
  focusCoords,
  focusZoom = 12,
}: MapViewportControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!focusCoords || !map) return;
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.setView(focusCoords, focusZoom, { animate: !reducedMotion });
  }, [map, focusCoords, focusZoom]);

  return null;
});

interface TaskMarkersLayerProps {
  tasks?: Task[];
  onTaskSelect?: (task: Task) => void;
}

const TaskMarkersLayer = memo(function TaskMarkersLayer({
  tasks,
  onTaskSelect,
}: TaskMarkersLayerProps) {
  const map = useMap();
  const onTaskSelectRef = useRef(onTaskSelect);
  onTaskSelectRef.current = onTaskSelect;

  useEffect(() => {
    if (!map || !tasks || tasks.length === 0) return;

    const renderer = L.canvas({ padding: 0.25, tolerance: 8 });
    const group = L.layerGroup().addTo(map);
    const today = getTodayDateString();

    for (const task of tasks) {
      const coords = parseCoordinates(task.coordinates);
      if (!coords) continue;

      const color = getTaskMarkerColor(task, today);
      const isCompleted = task.status?.toLowerCase() === "completed";
      const marker = L.circleMarker(coords, {
        renderer,
        radius: isCompleted ? 5.5 : 7,
        fillColor: color,
        color: "#0d1015",
        weight: 2,
        opacity: 1,
        fillOpacity: isCompleted ? 0.75 : 0.95,
      });

      const crewLabel = task.assigned_to_name || (task.assigned_to ? `Crew #${task.assigned_to}` : "Unassigned");
      marker.bindTooltip(
        `<div class="font-semibold text-xs text-gray-900">#${task.id}: ${task.title}</div><div class="text-[11px] text-gray-600">${task.status} · ${task.priority} · ${crewLabel}</div>`,
        { direction: "top", offset: [0, -6], opacity: 0.96 }
      );

      marker.on("click", () => {
        onTaskSelectRef.current?.(task);
      });

      marker.addTo(group);
    }

    return () => {
      if (map.hasLayer(group)) {
        map.removeLayer(group);
      }
      renderer.remove();
    };
  }, [map, tasks]);

  return null;
});

interface RailwayLayersProps {
  mainlineData: RailwayFeatureCollection | null;
  selectedLayerRef: React.MutableRefObject<StyledFeatureLayer | null>;
  onSelectFeature: (feature: RailwayFeature) => void;
  onHydrationStateChange: (hydrating: boolean) => void;
}

const RailwayLayers = memo(function RailwayLayers({
  mainlineData,
  selectedLayerRef,
  onSelectFeature,
  onHydrationStateChange,
}: RailwayLayersProps) {
  const map = useMap();
  const onSelectRef = useRef(onSelectFeature);
  onSelectRef.current = onSelectFeature;

  useEffect(() => {
    if (!mainlineData || !map) return;

    let cancelled = false;
    const renderer = L.canvas({ padding: 0.25, tolerance: 6 });

    const layerOptions: L.GeoJSONOptions = {
      style: () => ({
        color: "#3b82f6",
        weight: 2.2,
        opacity: 0.78,
        renderer,
      }),
      pointToLayer: (feature, latlng) => {
        const isStation = feature.properties?.railway === "station";
        return L.circleMarker(latlng, {
          renderer,
          radius: isStation ? 6.5 : 4.5,
          fillColor: isStation ? "#f59e0b" : "#06b6d4",
          color: "#ffffff",
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.95,
        });
      },
      onEachFeature: (feature, layer) => {
        if (feature.geometry?.type === "Point" && feature.properties?.name) {
          layer.bindTooltip(
            `<div class="font-semibold text-xs text-gray-900">${String(feature.properties.name)}</div><div class="text-[10px] text-gray-500">${feature.properties.railway === "station" ? "Station" : "Stop"}</div>`,
            { direction: "top", offset: [0, -6], opacity: 0.95 }
          );
        }
      },
    };

    const primaryGroup = L.geoJSON(undefined, layerOptions);
    const detailGroup = L.geoJSON(undefined, layerOptions);

    const handleDelegatedClick = (
      event: L.LeafletEvent & {
        propagatedFrom?: StyledFeatureLayer;
        layer?: StyledFeatureLayer;
      }
    ) => {
      const layer = event.propagatedFrom || event.layer;
      const feature = layer?.feature;
      if (!layer || !feature) return;

      if (selectedLayerRef.current && selectedLayerRef.current !== layer) {
        resetLayerStyle(selectedLayerRef.current);
      }

      highlightLayerStyle(layer, feature);
      selectedLayerRef.current = layer;
      onSelectRef.current(feature);
    };

    primaryGroup.on("click", handleDelegatedClick);
    detailGroup.on("click", handleDelegatedClick);
    primaryGroup.addTo(map);

    let detailPopulated = false;
    let detailPopulating = false;

    const addFeaturesInChunks = async (
      targetGroup: L.GeoJSON,
      features: RailwayFeature[]
    ) => {
      let deadline = performance.now() + LONG_TASK_BUDGET_MS;

      for (let i = 0; i < features.length; i += FEATURE_BATCH_SIZE) {
        if (cancelled) return;
        const batch: RailwayFeatureCollection = {
          type: "FeatureCollection",
          features: features.slice(i, i + FEATURE_BATCH_SIZE),
        };
        targetGroup.addData(batch);

        if (
          i + FEATURE_BATCH_SIZE < features.length &&
          performance.now() >= deadline
        ) {
          await yieldToMain();
          if (cancelled) return;
          deadline = performance.now() + LONG_TASK_BUDGET_MS;
        }
      }
    };

    // Fetch yard/spur detail tracks ONLY when user zooms in >= 11
    const syncDetailLayerForZoom = () => {
      if (cancelled) return;
      const shouldShowDetail = map.getZoom() >= DETAIL_MIN_ZOOM;

      if (shouldShowDetail) {
        if (!map.hasLayer(detailGroup)) {
          detailGroup.addTo(map);
        }
        if (!detailPopulated && !detailPopulating) {
          detailPopulating = true;
          const cachedDetail = getCachedDetailGeoJSON();
          const detailPromise = cachedDetail
            ? Promise.resolve(cachedDetail)
            : getDetailGeoJSON();

          void detailPromise
            .then((detailData) => {
              if (cancelled || !detailData?.features) return;
              return addFeaturesInChunks(detailGroup, detailData.features);
            })
            .then(() => {
              if (!cancelled) {
                detailPopulated = true;
              }
            })
            .catch(() => {
              // Ignore transient network errors for optional yard tracks
            })
            .finally(() => {
              detailPopulating = false;
            });
        }
      } else if (map.hasLayer(detailGroup)) {
        map.removeLayer(detailGroup);
      }
    };

    map.on("zoomend", syncDetailLayerForZoom);

    onHydrationStateChange(true);
    void addFeaturesInChunks(primaryGroup, mainlineData.features || []).then(
      () => {
        if (cancelled) return;
        onHydrationStateChange(false);
        syncDetailLayerForZoom();
      }
    );

    return () => {
      cancelled = true;
      map.off("zoomend", syncDetailLayerForZoom);
      primaryGroup.off("click", handleDelegatedClick);
      detailGroup.off("click", handleDelegatedClick);
      if (map.hasLayer(primaryGroup)) map.removeLayer(primaryGroup);
      if (map.hasLayer(detailGroup)) map.removeLayer(detailGroup);
      renderer.remove();
      selectedLayerRef.current = null;
    };
  }, [map, mainlineData, selectedLayerRef, onHydrationStateChange]);

  return null;
});

const RailwayMap = ({
  onFeatureSelect,
  tasks,
  onTaskSelect,
  focusCoords,
  focusZoom = 12,
  canDispatch = false,
  onDispatchTrack,
  minHeightClass = "min-h-[340px]",
}: RailwayMapProps) => {
  const [mainlineData, setMainlineData] =
    useState<RailwayFeatureCollection | null>(() => getCachedMainlineGeoJSON());
  const [selectedFeature, setSelectedFeature] = useState<RailwayFeature | null>(
    null
  );
  const [isFetching, setIsFetching] = useState<boolean>(
    () => !getCachedMainlineGeoJSON()
  );
  const [isHydratingLayers, setIsHydratingLayers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const selectedLayerRef = useRef<StyledFeatureLayer | null>(null);

  useEffect(() => {
    const existing = getCachedMainlineGeoJSON();
    if (existing) {
      setMainlineData(existing);
      setIsFetching(false);
      return;
    }

    let isMounted = true;
    getMainlineGeoJSON()
      .then((data) => {
        if (!isMounted) return;
        setMainlineData(data);
        setIsFetching(false);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error fetching GeoJSON data:", err);
        setIsFetching(false);
        setError("Failed to load railway map data.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFeatureSelect = useCallback(
    (feature: RailwayFeature) => {
      setSelectedFeature(feature);
      onFeatureSelect?.(feature);
    },
    [onFeatureSelect]
  );

  const showSyncBadge = (isFetching || isHydratingLayers) && !error;
  const centerPoint = selectedFeature?.geometry
    ? getMidpoint(selectedFeature.geometry)
    : null;

  return (
    <div
      className={`relative flex flex-col h-full ${minHeightClass} bg-[#151921] border border-[#242a36] rounded-xl overflow-hidden widget-contain-layout`}
    >
      {error && (
        <div className="absolute top-3 left-3 right-3 z-[450] rounded-lg bg-rose-950/90 border border-rose-500/40 px-3 py-2 text-rose-200 text-xs">
          {error}
        </div>
      )}

      {showSyncBadge && (
        <div className="absolute top-3 right-3 z-[450] pointer-events-none flex items-center gap-2 rounded-lg bg-[#0d1015]/90 border border-cyan-500/30 px-2.5 py-1 text-[11px] font-mono text-cyan-300">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          Syncing Rail Network...
        </div>
      )}

      <MapContainer
        center={focusCoords || DEFAULT_POSITION}
        zoom={focusCoords ? focusZoom : 10}
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
        aria-label="Alberta Railway Network Map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          updateWhenZooming={false}
          updateWhenIdle={true}
          keepBuffer={1}
        />

        <MapViewportController focusCoords={focusCoords} focusZoom={focusZoom} />

        <RailwayLayers
          mainlineData={mainlineData}
          selectedLayerRef={selectedLayerRef}
          onSelectFeature={handleFeatureSelect}
          onHydrationStateChange={setIsHydratingLayers}
        />

        <TaskMarkersLayer tasks={tasks} onTaskSelect={onTaskSelect} />

        {selectedFeature && selectedFeature.geometry && centerPoint && (
          <Popup
            position={centerPoint}
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
            <div className="min-w-[190px] max-w-[260px]">
              <h3 className="font-bold text-gray-900 text-xs">
                {String(
                  selectedFeature.properties?.name ||
                    selectedFeature.properties?.["@id"] ||
                    "Railway Segment"
                )}
              </h3>
              <ul className="text-[11px] space-y-0.5 mt-1.5 text-gray-700">
                {Boolean(selectedFeature.properties?.["@id"]) && (
                  <li>
                    <strong>ID:</strong> {String(selectedFeature.properties?.["@id"])}
                  </li>
                )}
                {Boolean(selectedFeature.properties?.operator) && (
                  <li>
                    <strong>Operator:</strong>{" "}
                    {String(selectedFeature.properties?.operator)}
                  </li>
                )}
                {Boolean(selectedFeature.properties?.service) && (
                  <li>
                    <strong>Service:</strong>{" "}
                    {String(selectedFeature.properties?.service)}
                  </li>
                )}
                {Boolean(selectedFeature.properties?.maxspeed) && (
                  <li>
                    <strong>Max Speed:</strong>{" "}
                    {String(selectedFeature.properties?.maxspeed)} km/h
                  </li>
                )}
              </ul>
              {canDispatch &&
                onDispatchTrack &&
                Boolean(selectedFeature.properties?.["@id"]) && (
                  <button
                    type="button"
                    onClick={() =>
                      onDispatchTrack({
                        trackId: String(selectedFeature.properties?.["@id"]),
                        name: String(
                          selectedFeature.properties?.name ||
                            selectedFeature.properties?.["@id"]
                        ),
                        lat: centerPoint[0],
                        lon: centerPoint[1],
                      })
                    }
                    className="mt-2.5 w-full rounded-md bg-cyan-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-cyan-500 transition-colors"
                  >
                    + Dispatch Work Order
                  </button>
                )}
            </div>
          </Popup>
        )}
      </MapContainer>

      {/* Compact legend for field & dispatch awareness */}
      <div className="pointer-events-none absolute bottom-2 left-2 z-[450] flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-[#0d1015]/88 border border-[#242a36] px-2.5 py-1 text-[10px] font-mono text-gray-300">
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-0.5 bg-blue-500 rounded" /> Track
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500" /> High/Overdue
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400" /> Active
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Pending
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Done
        </span>
      </div>
    </div>
  );
};

export default memo(RailwayMap);
