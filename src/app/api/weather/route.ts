import { NextResponse } from "next/server";
import {
  CorridorWeatherSnapshot,
  evaluateWeatherRisk,
  KEY_CORRIDORS,
  RailwayCorridor,
  WeatherSeriesPoint,
} from "@/utils/riskEngine";

type ServerWeatherCacheEntry = {
  data: CorridorWeatherSnapshot;
  timestamp: number;
};

const WEATHER_TTL_MS = 5 * 60_000;
const serverCache = new Map<string, ServerWeatherCacheEntry>();

function buildDegradedSnapshot(corridor: RailwayCorridor): CorridorWeatherSnapshot {
  return {
    id: corridor.id,
    name: corridor.name,
    operator: corridor.operator,
    trackId: corridor.trackId,
    region: corridor.region,
    lat: corridor.lat,
    lon: corridor.lon,
    tempC: 0,
    feelsLikeC: 0,
    windKmh: 0,
    gustKmh: 0,
    windDeg: 0,
    humidity: 0,
    condition: "Unavailable",
    description: "Live weather telemetry temporarily unavailable",
    precipMm: 0,
    series: [],
    riskLevel: "normal",
    risks: [],
    degraded: true,
  };
}

async function fetchCorridorForecast(
  corridor: RailwayCorridor,
  apiKey: string
): Promise<CorridorWeatherSnapshot> {
  const cacheKey = `${corridor.lat.toFixed(2)},${corridor.lon.toFixed(2)}:${corridor.trackId}`;
  const cached = serverCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < WEATHER_TTL_MS) {
    return cached.data;
  }

  if (!apiKey) {
    return buildDegradedSnapshot(corridor);
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${corridor.lat}&lon=${corridor.lon}&units=metric&cnt=16&appid=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      throw new Error(`OpenWeather HTTP ${res.status}`);
    }
    const json = await res.json();
    const list = Array.isArray(json?.list) ? json.list : [];
    const current = list[0];

    if (!current) {
      return buildDegradedSnapshot(corridor);
    }

    const tempC = Math.round(Number(current.main?.temp ?? 0));
    const feelsLikeC = Math.round(Number(current.main?.feels_like ?? tempC));
    // OpenWeather units=metric returns wind speed in m/s -> convert to km/h
    const windKmh = Math.round(Number(current.wind?.speed ?? 0) * 3.6);
    const gustKmh = Math.round(
      Number(current.wind?.gust ?? current.wind?.speed ?? 0) * 3.6
    );
    const windDeg = Math.round(Number(current.wind?.deg ?? 0));
    const humidity = Math.round(Number(current.main?.humidity ?? 0));
    const weatherItem = Array.isArray(current.weather)
      ? current.weather[0]
      : current.weather;
    const condition = String(weatherItem?.main || "Clear");
    const description = String(weatherItem?.description || condition);
    const precipMm = Number(
      (current.rain?.["3h"] ?? 0) + (current.snow?.["3h"] ?? 0)
    );

    const series: WeatherSeriesPoint[] = list.map((entry: Record<string, unknown>) => {
      const main = (entry.main || {}) as Record<string, unknown>;
      const wind = (entry.wind || {}) as Record<string, unknown>;
      const wArr = entry.weather as Array<Record<string, unknown>> | Record<string, unknown> | undefined;
      const wObj = Array.isArray(wArr) ? wArr[0] : wArr;
      const dtSec = Number(entry.dt ?? 0);
      const dateObj = new Date(dtSec * 1000);
      const hourLabel = dateObj.toLocaleString("en-CA", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      return {
        dt: dtSec,
        time: hourLabel,
        tempC: Math.round(Number(main.temp ?? 0)),
        windKmh: Math.round(Number(wind.speed ?? 0) * 3.6),
        gustKmh: Math.round(Number(wind.gust ?? wind.speed ?? 0) * 3.6),
        condition: String(wObj?.main || ""),
      };
    });

    const riskEval = evaluateWeatherRisk({
      id: corridor.id,
      name: corridor.name,
      trackId: corridor.trackId,
      lat: corridor.lat,
      lon: corridor.lon,
      tempC,
      windKmh,
      gustKmh,
      condition,
      precipMm,
    });

    const snapshot: CorridorWeatherSnapshot = {
      id: corridor.id,
      name: corridor.name,
      operator: corridor.operator,
      trackId: corridor.trackId,
      region: corridor.region,
      lat: corridor.lat,
      lon: corridor.lon,
      tempC,
      feelsLikeC,
      windKmh,
      gustKmh,
      windDeg,
      humidity,
      condition,
      description,
      precipMm: Number(precipMm.toFixed(1)),
      series,
      riskLevel: riskEval.level,
      risks: riskEval.risks,
    };

    serverCache.set(cacheKey, { data: snapshot, timestamp: Date.now() });
    return snapshot;
  } catch (err) {
    console.warn(`Weather fetch warning for ${corridor.name}:`, err);
    return buildDegradedSnapshot(corridor);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");
  const labelParam = searchParams.get("label");
  const trackIdParam = searchParams.get("trackId");

  const apiKey =
    process.env.OPENWEATHER_API_KEY ||
    process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ||
    "";

  if (latParam && lonParam) {
    const lat = Number(latParam);
    const lon = Number(lonParam);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json(
        { error: "Valid lat and lon are required." },
        { status: 400 }
      );
    }

    const customCorridor: RailwayCorridor = {
      id: trackIdParam || `point-${lat.toFixed(2)}-${lon.toFixed(2)}`,
      name: labelParam || trackIdParam || "Track Segment",
      operator: "Alberta Network",
      trackId: trackIdParam || `${lat.toFixed(3)},${lon.toFixed(3)}`,
      region: "Custom Coordinate",
      lat,
      lon,
    };

    const snapshot = await fetchCorridorForecast(customCorridor, apiKey);
    return NextResponse.json(snapshot, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  }

  const results = await Promise.allSettled(
    KEY_CORRIDORS.map((corridor) => fetchCorridorForecast(corridor, apiKey))
  );

  const corridors: CorridorWeatherSnapshot[] = results.map((result, idx) =>
    result.status === "fulfilled"
      ? result.value
      : buildDegradedSnapshot(KEY_CORRIDORS[idx])
  );

  return NextResponse.json(
    {
      corridors,
      fetchedAt: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
