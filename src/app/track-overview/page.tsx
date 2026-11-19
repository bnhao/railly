"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Star, Plus, ClipboardList } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import TrackDetailsTable from "@/components/track-overview/TrackDetailsTable";
import TrackMaintenanceChart from "@/components/track-overview/TrackMaintenanceChart";
import SearchBar from "@/components/track-overview/SearchBar";
import WorkOrderDialog, {
  WorkOrderPrefill,
} from "@/components/WorkOrderDialog";
import TaskDetailDialog from "@/components/TaskDetailDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { SubdivisionSummary, Task, TaskStatus } from "@/types/task";
import {
  fetchTasksCached,
  fetchTrackHistoryCached,
  getCachedTasks,
  invalidateHistoryCache,
  updateCachedTask,
} from "@/utils/apiCache";
import {
  getSubdivisionsIndex,
  preloadRailwayGeoJSON,
  RailwayFeature,
} from "@/utils/railwayDataCache";
import { formatDateOnly, parseCoordinates } from "@/utils/coordinates";
import type { TrackDispatchPayload } from "@/components/RailwayMap";
import type { BarSeriesItem } from "@/components/ui/MiniCharts";

const RailwayMap = dynamic(() => import("@/components/RailwayMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[380px] h-full bg-[#151921] border border-[#242a36] rounded-xl text-xs font-mono text-gray-400">
      Loading Railway GIS Map...
    </div>
  ),
});

const AIchatbot = dynamic(() => import("@/components/AIchatbot"), {
  ssr: false,
  loading: () => null,
});

const FAVORITES_KEY = "railly_favorite_tracks_v1";
const ALLOWED_ROLES = ["admin", "user"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export default function TrackOverviewPage() {
  const { user, role } = useAuth();
  const toast = useToast();
  const isAdmin = role === "admin";

  const [subdivisions, setSubdivisions] = useState<SubdivisionSummary[]>([]);
  const [tasks, setTasks] = useState<Task[]>(() => getCachedTasks<Task>() ?? []);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [selectedSubName, setSelectedSubName] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [favoriteTracks, setFavoriteTracks] = useState<string[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [focusCoords, setFocusCoords] = useState<[number, number] | null>(null);
  const [historyItems, setHistoryItems] = useState<BarSeriesItem[]>([]);

  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [dispatchPrefill, setDispatchPrefill] =
    useState<WorkOrderPrefill | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  const historySeq = useRef(0);

  useEffect(() => {
    setFavoriteTracks(readFavorites());
  }, []);

  const loadHistoryForTrack = useCallback((trackId: string) => {
    if (!trackId) {
      setHistoryItems([]);
      return;
    }
    const reqId = ++historySeq.current;
    fetchTrackHistoryCached<Task>(trackId).then((entries) => {
      if (reqId !== historySeq.current) return;
      const monthCounts = new Map<string, { label: string; count: number }>();

      for (const entry of entries) {
        const dStr = formatDateOnly(entry.start_date);
        const dt = dStr ? new Date(dStr) : null;
        if (!dt || Number.isNaN(dt.getTime())) continue;
        const sortKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
        const label = `${MONTH_NAMES[dt.getMonth()]} ${String(dt.getFullYear()).slice(-2)}`;
        const curr = monthCounts.get(sortKey) || { label, count: 0 };
        curr.count++;
        monthCounts.set(sortKey, curr);
      }

      const sorted = Array.from(monthCounts.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => ({ label: v.label, primary: v.count }));

      setHistoryItems(sorted);
    });
  }, []);

  const selectSubdivision = useCallback(
    (sub: SubdivisionSummary) => {
      setSelectedTrackId(sub.trackId);
      setSelectedSubName(sub.name);
      setFocusCoords([sub.lat, sub.lon]);
      setSelectedDetails({
        "@id": sub.trackId,
        name: sub.name,
        operator: sub.operator || "Alberta Rail",
        service: "mainline",
      });
      loadHistoryForTrack(sub.trackId);
    },
    [loadHistoryForTrack]
  );

  const selectFeatureFromMap = useCallback(
    (feature: RailwayFeature) => {
      const props = (feature.properties || {}) as Record<string, unknown>;
      const id = String(props["@id"] || "");
      setSelectedTrackId(id);
      setSelectedSubName(String(props.name || id));
      setSelectedDetails(props);
      loadHistoryForTrack(id);
    },
    [loadHistoryForTrack]
  );

  useEffect(() => {
    preloadRailwayGeoJSON();
    let mounted = true;

    Promise.all([getSubdivisionsIndex(), fetchTasksCached<Task>()]).then(
      ([subs, fetchedTasks]) => {
        if (!mounted) return;
        setSubdivisions(subs);
        setTasks(fetchedTasks);

        const params = new URLSearchParams(window.location.search);
        const queryTrack = params.get("track")?.trim();
        if (queryTrack) {
          const matchedSub = subs.find(
            (s) =>
              s.trackId === queryTrack ||
              s.name.toLowerCase() === queryTrack.toLowerCase()
          );
          if (matchedSub) {
            selectSubdivision(matchedSub);
            setSearchTerm(matchedSub.name);
            return;
          }

          const matchedTask = fetchedTasks.find(
            (t) => String(t.track_id) === queryTrack
          );
          const taskCoords = parseCoordinates(matchedTask?.coordinates);
          setSelectedTrackId(queryTrack);
          setSelectedSubName(queryTrack);
          if (taskCoords) setFocusCoords(taskCoords);
          setSelectedDetails({
            "@id": queryTrack,
            name: matchedTask?.title || queryTrack,
          });
          loadHistoryForTrack(queryTrack);
        } else if (subs.length > 0) {
          // Default to Laggan Subdivision for immediate useful telemetry
          const defaultSub =
            subs.find((s) => s.name.includes("Laggan")) || subs[0];
          selectSubdivision(defaultSub);
        }
      }
    );

    return () => {
      mounted = false;
    };
  }, [loadHistoryForTrack, selectSubdivision]);

  const toggleFavorite = useCallback(() => {
    if (!selectedTrackId) return;
    setFavoriteTracks((prev) => {
      const next = prev.includes(selectedTrackId)
        ? prev.filter((id) => id !== selectedTrackId)
        : [...prev, selectedTrackId];
      try {
        window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage write failure
      }
      return next;
    });
  }, [selectedTrackId]);

  const relatedTasks = useMemo(() => {
    if (!selectedTrackId) return [];
    return tasks.filter((t) => String(t.track_id) === selectedTrackId);
  }, [tasks, selectedTrackId]);

  const handleDispatchFromMap = useCallback((info: TrackDispatchPayload) => {
    setDispatchPrefill({
      title: `Track Inspection — ${info.name}`,
      description: `Scheduled inspection on ${info.name} (${info.trackId}).`,
      priority: "Medium",
      trackId: info.trackId,
      trackLabel: info.name,
      lat: info.lat,
      lon: info.lon,
    });
    setIsDispatchOpen(true);
  }, []);

  const openDispatchForSelected = () => {
    if (!selectedTrackId) return;
    const matchedSub = subdivisions.find((s) => s.trackId === selectedTrackId);
    setDispatchPrefill({
      title: `Maintenance Check — ${selectedSubName || selectedTrackId}`,
      description: `Inspection dispatched from Track Overview for ${selectedSubName || selectedTrackId}.`,
      priority: "Medium",
      trackId: selectedTrackId,
      trackLabel: selectedSubName || selectedTrackId,
      lat: focusCoords?.[0] ?? matchedSub?.lat ?? 51.0447,
      lon: focusCoords?.[1] ?? matchedSub?.lon ?? -114.0719,
    });
    setIsDispatchOpen(true);
  };

  const handleStatusChange = async (task: Task, nextStatus: TaskStatus) => {
    const previous = task;
    const optimistic: Task = { ...task, status: nextStatus };
    setUpdatingTaskId(task.id);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? optimistic : t)));
    if (detailTask?.id === task.id) setDetailTask(optimistic);
    updateCachedTask(optimistic);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      const saved: Task = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      if (detailTask?.id === saved.id) setDetailTask(saved);
      updateCachedTask(saved);
      toast.success(`Order #${saved.id} -> ${saved.status}`);
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === previous.id ? previous : t)));
      if (detailTask?.id === previous.id) setDetailTask(previous);
      updateCachedTask(previous);
      toast.error("Failed to update status.");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={ALLOWED_ROLES}>
      <div className="min-h-screen bg-[#0d1015] text-gray-200 px-4 py-4 lg:px-6 lg:py-5 space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-100 tracking-tight">
              Track & Corridor Overview
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Inspect 152 Alberta subdivisions, bookmark priority segments, and
              review maintenance history.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <SearchBar
              subdivisions={subdivisions}
              onSelectSubdivision={selectSubdivision}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />

            <select
              aria-label="Jump to track with active work order"
              value={selectedTrackId}
              onChange={(e) => {
                const tid = e.target.value;
                if (!tid) return;
                const matchedSub = subdivisions.find((s) => s.trackId === tid);
                if (matchedSub) {
                  selectSubdivision(matchedSub);
                  return;
                }
                const matchedTask = tasks.find(
                  (t) => String(t.track_id) === tid
                );
                const coords = parseCoordinates(matchedTask?.coordinates);
                setSelectedTrackId(tid);
                setSelectedSubName(matchedTask?.title || tid);
                if (coords) setFocusCoords(coords);
                setSelectedDetails({
                  "@id": tid,
                  name: matchedTask?.title || tid,
                });
                loadHistoryForTrack(tid);
              }}
              className="rounded-lg bg-[#151921] border border-[#242a36] px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">Tracks With Active Orders...</option>
              {tasks.map((t) => (
                <option key={t.id} value={String(t.track_id)}>
                  #{t.id} · {t.track_id} ({t.title})
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Bookmarked Favorite Tracks Strip */}
        {favoriteTracks.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-amber-300 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              Bookmarked:
            </span>
            {favoriteTracks.map((fav) => {
              const sub = subdivisions.find((s) => s.trackId === fav);
              return (
                <button
                  key={fav}
                  type="button"
                  onClick={() => {
                    if (sub) {
                      selectSubdivision(sub);
                    } else {
                      setSelectedTrackId(fav);
                      setSelectedSubName(fav);
                      loadHistoryForTrack(fav);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md font-mono text-[11px] border transition-colors ${
                    selectedTrackId === fav
                      ? "bg-cyan-600/20 border-cyan-500 text-cyan-300"
                      : "bg-[#151921] border-[#242a36] text-gray-300 hover:bg-[#1e2430]"
                  }`}
                >
                  {sub ? `${sub.name} (${fav})` : fav}
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Left 5 cols: Details + History + Related Work Orders */}
          <div className="xl:col-span-5 space-y-4">
            {selectedDetails ? (
              <TrackDetailsTable
                details={selectedDetails}
                isFavorite={favoriteTracks.includes(selectedTrackId)}
                onToggleFavorite={toggleFavorite}
                canDispatch={isAdmin}
                onDispatch={openDispatchForSelected}
              />
            ) : (
              <div className="rounded-xl p-6 bg-[#151921] border border-[#242a36] text-center text-xs text-gray-400">
                Select a subdivision above or click any track line on the map.
              </div>
            )}

            <TrackMaintenanceChart
              items={historyItems}
              trackLabel={selectedSubName || selectedTrackId}
            />

            <div className="rounded-xl p-5 bg-[#151921] border border-[#242a36] space-y-3 widget-contain">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-cyan-400" />
                  Work Orders on {selectedTrackId || "Selected Track"}
                </h2>
                {isAdmin && selectedTrackId && (
                  <button
                    type="button"
                    onClick={openDispatchForSelected}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                )}
              </div>

              {relatedTasks.length === 0 ? (
                <p className="text-xs text-gray-500 py-2">
                  No active work orders specifically assigned to {selectedTrackId || "this segment"}.
                </p>
              ) : (
                <div className="space-y-2">
                  {relatedTasks.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDetailTask(t)}
                      className="w-full text-left rounded-lg bg-[#0d1015] hover:bg-[#1b202b] border border-[#242a36] p-3 flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-100 truncate">
                          #{t.id}: {t.title}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {t.assigned_to_name || "Unassigned"} · Due{" "}
                          {formatDateOnly(t.end_date)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${
                          t.status?.toLowerCase() === "completed"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            : t.status?.toLowerCase() === "in progress"
                              ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                              : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {t.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right 7 cols: Full-Height GIS Map */}
          <div className="xl:col-span-7 min-h-[460px] xl:min-h-[680px]">
            <RailwayMap
              onFeatureSelect={selectFeatureFromMap}
              tasks={tasks}
              onTaskSelect={(task) => setDetailTask(task)}
              focusCoords={focusCoords}
              focusZoom={12}
              canDispatch={isAdmin}
              onDispatchTrack={handleDispatchFromMap}
              minHeightClass="min-h-[460px] xl:min-h-[680px]"
            />
          </div>
        </div>

        <WorkOrderDialog
          isOpen={isDispatchOpen}
          onClose={() => {
            setIsDispatchOpen(false);
            setDispatchPrefill(null);
          }}
          prefill={dispatchPrefill}
          createdByLabel={user?.email || "Supervisor"}
          onSaved={(saved) => {
            setTasks((prev) => [saved, ...prev]);
            invalidateHistoryCache();
            if (saved.track_id === selectedTrackId) {
              loadHistoryForTrack(saved.track_id);
            }
          }}
        />

        <TaskDetailDialog
          isOpen={Boolean(detailTask)}
          onClose={() => setDetailTask(null)}
          task={detailTask}
          isAdmin={isAdmin}
          isUpdating={updatingTaskId === detailTask?.id}
          onStatusChange={handleStatusChange}
        />
      </div>
      <AIchatbot />
    </ProtectedRoute>
  );
}
