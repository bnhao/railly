/**
 * Split & cached telemetry loader for Alberta railway GeoJSON & subdivision index.
 * Loads only the ~695 KB mainline file + ~19 KB subdivision index on initial
 * map render, deferring the ~1.0 MB yard/spur/siding detail file until zoom >= 11.
 */
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { SubdivisionSummary } from "@/types/task";

export type RailwayFeatureProperties = Record<string, unknown> & {
  "@id"?: string;
  name?: string;
  railway?: string;
  service?: string;
  operator?: string;
};

export type RailwayFeature = Feature<Geometry, RailwayFeatureProperties>;
export type RailwayFeatureCollection = FeatureCollection<
  Geometry,
  RailwayFeatureProperties
>;

let cachedMainline: RailwayFeatureCollection | null = null;
let cachedDetail: RailwayFeatureCollection | null = null;
let cachedSubdivisions: SubdivisionSummary[] | null = null;
let cachedTrackCoordinates: Record<string, [number, number][]> | null = null;

let inFlightMainline: Promise<RailwayFeatureCollection> | null = null;
let inFlightDetail: Promise<RailwayFeatureCollection> | null = null;
let inFlightSubdivisions: Promise<SubdivisionSummary[]> | null = null;

export const getMainlineGeoJSON = async (): Promise<RailwayFeatureCollection> => {
  if (cachedMainline) return cachedMainline;
  if (inFlightMainline) return inFlightMainline;

  inFlightMainline = fetch("/Alberta-mainline.geojson")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load mainline GeoJSON: ${res.statusText}`);
      }
      return res.json() as Promise<RailwayFeatureCollection>;
    })
    .then((data) => {
      cachedMainline = data;
      inFlightMainline = null;
      return data;
    })
    .catch((err) => {
      inFlightMainline = null;
      throw err;
    });

  return inFlightMainline;
};

export const getDetailGeoJSON = async (): Promise<RailwayFeatureCollection> => {
  if (cachedDetail) return cachedDetail;
  if (inFlightDetail) return inFlightDetail;

  inFlightDetail = fetch("/Alberta-detail.geojson")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load detail GeoJSON: ${res.statusText}`);
      }
      return res.json() as Promise<RailwayFeatureCollection>;
    })
    .then((data) => {
      cachedDetail = data;
      inFlightDetail = null;
      return data;
    })
    .catch((err) => {
      inFlightDetail = null;
      throw err;
    });

  return inFlightDetail;
};

export const getSubdivisionsIndex = async (): Promise<SubdivisionSummary[]> => {
  if (cachedSubdivisions) return cachedSubdivisions;
  if (inFlightSubdivisions) return inFlightSubdivisions;

  inFlightSubdivisions = fetch("/Alberta-subdivisions.json")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load subdivisions index: ${res.statusText}`);
      }
      return res.json() as Promise<SubdivisionSummary[]>;
    })
    .then((data) => {
      cachedSubdivisions = Array.isArray(data) ? data : [];
      inFlightSubdivisions = null;
      return cachedSubdivisions;
    })
    .catch((err) => {
      inFlightSubdivisions = null;
      throw err;
    });

  return inFlightSubdivisions;
};

export const getCachedMainlineGeoJSON = (): RailwayFeatureCollection | null =>
  cachedMainline;

export const getCachedDetailGeoJSON = (): RailwayFeatureCollection | null =>
  cachedDetail;

export const getCachedSubdivisionsIndex = (): SubdivisionSummary[] | null =>
  cachedSubdivisions;

export const preloadRailwayGeoJSON = (): void => {
  if (typeof window === "undefined") return;
  if (!cachedSubdivisions && !inFlightSubdivisions) {
    void getSubdivisionsIndex().catch(() => {});
  }
  if (!cachedMainline && !inFlightMainline) {
    void getMainlineGeoJSON().catch(() => {});
  }
};

export const getTrackCoordinatesMap = async (): Promise<
  Record<string, [number, number][]>
> => {
  if (cachedTrackCoordinates && cachedDetail) {
    return cachedTrackCoordinates;
  }

  const map: Record<string, [number, number][]> = cachedTrackCoordinates
    ? { ...cachedTrackCoordinates }
    : {};

  // Seed lightweight subdivision midpoints first (~152 entries)
  try {
    const subs = await getSubdivisionsIndex();
    for (let i = 0; i < subs.length; i++) {
      const sub = subs[i];
      if (sub.trackId && !map[sub.trackId]) {
        map[sub.trackId] = [[sub.lon, sub.lat]];
      }
    }
  } catch {
    // Non-fatal; fallback to GeoJSON collections
  }

  const ingest = (collection: RailwayFeatureCollection | null) => {
    if (!collection?.features) return;
    for (let i = 0; i < collection.features.length; i++) {
      const feature = collection.features[i];
      const trackId = feature?.properties?.["@id"];
      if (
        typeof trackId === "string" &&
        feature?.geometry &&
        "coordinates" in feature.geometry
      ) {
        map[trackId] = feature.geometry.coordinates as [number, number][];
      }
    }
  };

  ingest(await getMainlineGeoJSON());
  if (cachedDetail) {
    ingest(cachedDetail);
  }

  cachedTrackCoordinates = map;
  return map;
};

export const lookupTrackCoordinates = async (
  trackId: string
): Promise<[number, number][] | null> => {
  const normalized = trackId.trim();
  if (!normalized) return null;

  const candidates = [
    normalized,
    `way/${normalized}`,
    `node/${normalized}`,
  ];

  const baseMap = await getTrackCoordinatesMap();
  for (const key of candidates) {
    if (baseMap[key]) return baseMap[key];
  }

  // Fallback to detail GeoJSON only if not found in mainline/subdivisions
  const detail = await getDetailGeoJSON();
  for (let i = 0; i < (detail?.features?.length ?? 0); i++) {
    const feature = detail.features[i];
    const id = feature?.properties?.["@id"];
    if (
      typeof id === "string" &&
      candidates.includes(id) &&
      feature?.geometry &&
      "coordinates" in feature.geometry
    ) {
      const coords = feature.geometry.coordinates as [number, number][];
      baseMap[id] = coords;
      return coords;
    }
  }

  return null;
};
