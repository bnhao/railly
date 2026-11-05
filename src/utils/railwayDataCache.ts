/**
 * Shared in-memory cache and promise deduplicator for railway GeoJSON data.
 * Ensures the GeoJSON telemetry is fetched at most ONCE across all components
 * and cached in memory for zero-latency subsequent access.
 */

let cachedData: any = null;
let inFlightPromise: Promise<any> | null = null;

export const getRailwayGeoJSON = async (): Promise<any> => {
  if (cachedData) {
    return cachedData;
  }

  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = fetch("/Alberta.geojson")
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load railway GeoJSON: ${res.statusText}`);
      return res.json();
    })
    .then((data) => {
      cachedData = data;
      inFlightPromise = null;
      return data;
    })
    .catch((err) => {
      inFlightPromise = null;
      throw err;
    });

  return inFlightPromise;
};

export const getCachedRailwayGeoJSON = (): any => cachedData;
