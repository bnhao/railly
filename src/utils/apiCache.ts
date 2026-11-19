/**
 * Client-side in-memory cache and in-flight request deduplicator for API
 * endpoints, weather risk snapshots, and feedback entries.
 */
import type { Task } from "@/types/task";
import type { FeedbackData } from "@/types/feedback";
import type { CorridorWeatherSnapshot } from "@/utils/riskEngine";

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const responseCache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

const DEFAULT_API_TTL_MS = 30_000;
const WEATHER_TTL_MS = 5 * 60_000;

function getFreshCache<T>(key: string, ttlMs: number): T | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    return null;
  }
  return entry.data as T;
}

export function getCachedValue<T>(key: string): T | null {
  const entry = responseCache.get(key);
  return entry ? (entry.data as T) : null;
}

async function fetchJsonCached<T>(
  key: string,
  url: string,
  ttlMs: number = DEFAULT_API_TTL_MS,
  forceRefresh: boolean = false
): Promise<T> {
  if (!forceRefresh) {
    const fresh = getFreshCache<T>(key, ttlMs);
    if (fresh !== null) {
      return fresh;
    }
  }

  const existingPromise = inFlightRequests.get(key);
  if (existingPromise) {
    return existingPromise as Promise<T>;
  }

  const requestPromise = fetch(url)
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Request failed (${res.status}): ${res.statusText}`);
      }
      const data = (await res.json()) as T;
      responseCache.set(key, { data, timestamp: Date.now() });
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, requestPromise);
  return requestPromise;
}

export function invalidateCacheKey(key: string): void {
  responseCache.delete(key);
}

export function invalidateCachePrefix(prefix: string): void {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }
}

export function getCachedTasks<T = Task>(): T[] | null {
  return getCachedValue<T[]>("api:tasks");
}

export async function fetchTasksCached<T = Task>(
  forceRefresh = false
): Promise<T[]> {
  try {
    const data = await fetchJsonCached<T[]>(
      "api:tasks",
      "/api/tasks",
      DEFAULT_API_TTL_MS,
      forceRefresh
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return getCachedTasks<T>() ?? [];
  }
}

export function updateCachedTask(updated: Task): void {
  const existing = getCachedTasks<Task>();
  if (!existing) return;
  const idx = existing.findIndex((t) => t.id === updated.id);
  const next =
    idx >= 0
      ? existing.map((t) => (t.id === updated.id ? updated : t))
      : [updated, ...existing];
  responseCache.set("api:tasks", { data: next, timestamp: Date.now() });
}

export function removeCachedTask(taskId: number): void {
  const existing = getCachedTasks<Task>();
  if (!existing) return;
  responseCache.set("api:tasks", {
    data: existing.filter((t) => t.id !== taskId),
    timestamp: Date.now(),
  });
}

export function invalidateTasksCache(): void {
  invalidateCacheKey("api:tasks");
}

export function getCachedUsers<T = unknown>(): T[] | null {
  return getCachedValue<T[]>("api:users");
}

export async function fetchUsersCached<T = unknown>(
  forceRefresh = false
): Promise<T[]> {
  try {
    const data = await fetchJsonCached<T[]>(
      "api:users",
      "/api/users",
      DEFAULT_API_TTL_MS,
      forceRefresh
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching users:", error);
    return getCachedUsers<T>() ?? [];
  }
}

export function invalidateUsersCache(): void {
  invalidateCacheKey("api:users");
}

export async function fetchTrackHistoryCached<T = unknown>(
  trackId: string,
  forceRefresh = false
): Promise<T[]> {
  if (!trackId) return [];
  const key = `api:history:${trackId}`;
  try {
    const data = await fetchJsonCached<T[]>(
      key,
      `/api/history?track_id=${encodeURIComponent(trackId)}`,
      DEFAULT_API_TTL_MS,
      forceRefresh
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching track history:", error);
    return [];
  }
}

export function invalidateHistoryCache(): void {
  invalidateCachePrefix("api:history:");
}

export function getCachedCorridorWeather(): CorridorWeatherSnapshot[] | null {
  const entry = getCachedValue<{ corridors?: CorridorWeatherSnapshot[] }>(
    "api:weather:corridors"
  );
  return entry?.corridors ?? null;
}

export async function fetchCorridorWeatherCached(
  forceRefresh = false
): Promise<CorridorWeatherSnapshot[]> {
  try {
    const res = await fetchJsonCached<{ corridors?: CorridorWeatherSnapshot[] }>(
      "api:weather:corridors",
      "/api/weather",
      WEATHER_TTL_MS,
      forceRefresh
    );
    return Array.isArray(res?.corridors) ? res.corridors : [];
  } catch (error) {
    console.error("Error fetching corridor weather:", error);
    return getCachedCorridorWeather() ?? [];
  }
}

export async function fetchPointWeatherCached(
  lat: number,
  lon: number,
  trackId?: string,
  label?: string,
  forceRefresh = false
): Promise<CorridorWeatherSnapshot | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const key = `api:weather:${lat.toFixed(2)},${lon.toFixed(2)}`;
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  });
  if (trackId) params.set("trackId", trackId);
  if (label) params.set("label", label);

  try {
    return await fetchJsonCached<CorridorWeatherSnapshot>(
      key,
      `/api/weather?${params.toString()}`,
      WEATHER_TTL_MS,
      forceRefresh
    );
  } catch (error) {
    console.error("Error fetching track weather:", error);
    return null;
  }
}

export function getCachedFeedback(): FeedbackData[] | null {
  return getCachedValue<FeedbackData[]>("api:feedback");
}

export async function fetchFeedbackCached(
  forceRefresh = false
): Promise<FeedbackData[]> {
  try {
    const data = await fetchJsonCached<FeedbackData[]>(
      "api:feedback",
      "/api/feedback",
      DEFAULT_API_TTL_MS,
      forceRefresh
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return getCachedFeedback() ?? [];
  }
}

export function invalidateFeedbackCache(): void {
  invalidateCacheKey("api:feedback");
}
