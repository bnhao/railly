/**
 * Shared geographic coordinate and date/time formatting helpers for railway tasks.
 * Normalizes Postgres array strings (`{{"-114.28","51.10"}}`), JSON strings, and
 * `[lon, lat]` tuples into Leaflet-ready `[lat, lon]` pairs.
 */

export function parseCoordinates(input: unknown): [number, number] | null {
  if (!input) return null;

  const normalizePair = (a: number, b: number): [number, number] | null => {
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    // In Alberta, lat is around +49..+60 and lon is around -120..-110.
    // GeoJSON & DB store [lon, lat]; swap if first value looks like lon (< 0 or |a| > 90)
    // or looks like standard [lon, lat] while keeping fallback validation.
    let lat = b;
    let lon = a;
    if (Math.abs(a) <= 90 && (b < -90 || (a > 0 && b < 0))) {
      lat = a;
      lon = b;
    }
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
    return [lat, lon];
  };

  try {
    if (Array.isArray(input)) {
      if (input.length === 0) return null;
      const first = Array.isArray(input[0]) ? input[0] : input;
      if (Array.isArray(first) && first.length >= 2) {
        return normalizePair(Number(first[0]), Number(first[1]));
      }
      if (input.length >= 2) {
        return normalizePair(Number(input[0]), Number(input[1]));
      }
      return null;
    }

    const raw = String(input).trim();
    if (!raw) return null;

    if (raw.startsWith("[")) {
      const parsed = JSON.parse(raw);
      return parseCoordinates(parsed);
    }

    // Extract numbers from Postgres array literals like {{"-114.28228","51.10410"}}
    const matches = raw.match(/-?\d+(?:\.\d+)?/g);
    if (!matches || matches.length < 2) return null;
    return normalizePair(Number(matches[0]), Number(matches[1]));
  } catch {
    return null;
  }
}

export function serializeCoordinates(lat: number, lon: number): string {
  return JSON.stringify([[Number(lon.toFixed(5)), Number(lat.toFixed(5))]]);
}

export function formatDateOnly(val?: string | null): string {
  if (!val) return "";
  const str = String(val);
  return str.includes("T") ? str.split("T")[0] : str.slice(0, 10);
}

export function formatTimeShort(val?: string | null): string {
  if (!val) return "";
  const str = String(val);
  // Handles "13:03:00" -> "13:03"
  return str.length >= 5 ? str.slice(0, 5) : str;
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getCompassDirection(degree?: number | null): string {
  if (degree === undefined || degree === null || Number.isNaN(degree)) {
    return "-";
  }
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round((((degree % 360) + 360) % 360) / 45) % 8;
  return directions[index];
}
