"use client";
import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  AlertTriangle,
  Plus,
  RefreshCw,
  CheckCircle2,
  ClipboardList,
  Users,
  Wind,
  Thermometer,
  Search,
  Edit2,
  Trash2,
  Play,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ConfirmDialog } from "@/components/ui/AppDialog";
import { useToast } from "@/components/ui/ToastProvider";
import WorkOrderDialog, {
  WorkOrderPrefill,
} from "@/components/WorkOrderDialog";
import TaskDetailDialog from "@/components/TaskDetailDialog";
import { Task, TaskStatus } from "@/types/task";
import {
  fetchCorridorWeatherCached,
  fetchTasksCached,
  fetchUsersCached,
  getCachedCorridorWeather,
  getCachedTasks,
  getCachedUsers,
  invalidateHistoryCache,
  removeCachedTask,
  updateCachedTask,
} from "@/utils/apiCache";
import { preloadRailwayGeoJSON } from "@/utils/railwayDataCache";
import {
  formatDateOnly,
  formatTimeShort,
  getTodayDateString,
  parseCoordinates,
} from "@/utils/coordinates";
import {
  CorridorWeatherSnapshot,
  evaluateOperationalRisks,
  OperationalRisk,
} from "@/utils/riskEngine";
import type { TrackDispatchPayload } from "@/components/RailwayMap";

const RailwayMap = dynamic(() => import("@/components/RailwayMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[340px] bg-[#151921] border border-[#242a36] rounded-xl text-xs font-mono text-gray-400">
      Initializing Railway Map...
    </div>
  ),
});

const AIchatbot = dynamic(() => import("@/components/AIchatbot"), {
  ssr: false,
  loading: () => null,
});

interface CrewUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

type QueueFilter = "all" | "mine" | "pending" | "in progress" | "completed";

const ALLOWED_ROLES = ["admin", "user"];

export default function DashboardClient() {
  const { user, role } = useAuth();
  const toast = useToast();
  const isAdmin = role === "admin";

  const [tasks, setTasks] = useState<Task[]>(() => getCachedTasks<Task>() ?? []);
  const [corridors, setCorridors] = useState<CorridorWeatherSnapshot[]>(
    () => getCachedCorridorWeather() ?? []
  );
  const [crewUsers, setCrewUsers] = useState<CrewUser[]>(
    () => (getCachedUsers<CrewUser>() ?? []) as CrewUser[]
  );
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(
    () => !getCachedTasks<Task>()
  );
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(
    () => !getCachedCorridorWeather()
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [queueFilter, setQueueFilter] = useState<QueueFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  // Dialog & action states
  const [isWorkOrderOpen, setIsWorkOrderOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dispatchPrefill, setDispatchPrefill] =
    useState<WorkOrderPrefill | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  // Map focus coordinates when inspecting a corridor or track
  const [mapFocus, setMapFocus] = useState<[number, number] | null>(null);

  const loadAllData = useCallback(async (force = false) => {
    let mounted = true;
    const [fetchedTasks, fetchedWeather, fetchedUsers] = await Promise.all([
      fetchTasksCached<Task>(force),
      fetchCorridorWeatherCached(force),
      fetchUsersCached<CrewUser>(force),
    ]);
    if (!mounted) return;
    setTasks(fetchedTasks);
    setCorridors(fetchedWeather);
    setCrewUsers(fetchedUsers);
    setIsLoadingTasks(false);
    setIsLoadingWeather(false);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    preloadRailwayGeoJSON();
    void loadAllData(false);
  }, [loadAllData]);

  // Default workers cleanly to "My Tasks" if they have assigned work orders
  const userEmailLower = user?.email?.toLowerCase() || "";
  const myTasksCount = useMemo(() => {
    if (!userEmailLower) return 0;
    return tasks.filter(
      (t) =>
        t.assigned_to_email?.toLowerCase() === userEmailLower &&
        t.status?.toLowerCase() !== "completed"
    ).length;
  }, [tasks, userEmailLower]);

  useEffect(() => {
    if (role === "user" && myTasksCount > 0) {
      setQueueFilter((prev) => (prev === "all" ? "mine" : prev));
    }
  }, [role, myTasksCount]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllData(true);
    setIsRefreshing(false);
    toast.info("Telemetry and work orders synced.");
  };

  const risks = useMemo(
    () => evaluateOperationalRisks(tasks, corridors),
    [tasks, corridors]
  );

  const today = getTodayDateString();

  const metrics = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;

    for (const t of tasks) {
      const s = t.status?.toLowerCase();
      if (s === "completed") {
        completed++;
      } else {
        if (s === "in progress") inProgress++;
        else pending++;
        const endDate = formatDateOnly(t.end_date);
        if (endDate && endDate < today) overdue++;
      }
    }

    const criticalCount = risks.filter((r) => r.severity === "critical").length;
    const highCount = risks.filter((r) => r.severity === "high").length;
    const totalOpen = pending + inProgress;
    const completionPct =
      tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    return {
      pending,
      inProgress,
      completed,
      overdue,
      totalOpen,
      completionPct,
      criticalCount,
      highCount,
    };
  }, [tasks, risks, today]);

  const filteredTasks = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return tasks.filter((t) => {
      const s = t.status?.toLowerCase() || "";
      if (queueFilter === "mine") {
        if (
          !userEmailLower ||
          t.assigned_to_email?.toLowerCase() !== userEmailLower
        ) {
          return false;
        }
      } else if (queueFilter === "pending" && s !== "pending") {
        return false;
      } else if (queueFilter === "in progress" && s !== "in progress") {
        return false;
      } else if (queueFilter === "completed" && s !== "completed") {
        return false;
      }

      if (!q) return true;
      return (
        String(t.id).includes(q) ||
        t.title?.toLowerCase().includes(q) ||
        t.track_id?.toLowerCase().includes(q) ||
        t.assigned_to_name?.toLowerCase().includes(q) ||
        t.priority?.toLowerCase().includes(q)
      );
    });
  }, [tasks, queueFilter, deferredSearch, userEmailLower]);

  // Optimistic 1-tap status transitions for both workers and supervisors
  const handleStatusChange = useCallback(
    async (task: Task, nextStatus: TaskStatus) => {
      if (task.status === nextStatus) return;
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

        if (!res.ok) {
          throw new Error("Failed to save status");
        }

        const saved: Task = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
        if (detailTask?.id === saved.id) setDetailTask(saved);
        updateCachedTask(saved);
        toast.success(`Order #${saved.id} marked ${saved.status}.`);
      } catch {
        // Revert optimistic update on failure
        setTasks((prev) => prev.map((t) => (t.id === previous.id ? previous : t)));
        if (detailTask?.id === previous.id) setDetailTask(previous);
        updateCachedTask(previous);
        toast.error("Could not update task status. Please try again.");
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [detailTask, toast]
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");

      removeCachedTask(deleteTarget.id);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      if (detailTask?.id === deleteTarget.id) setDetailTask(null);
      toast.success(`Deleted Work Order #${deleteTarget.id}.`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete work order.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openDispatchFromRisk = (risk: OperationalRisk) => {
    if (risk.suggestedTask) {
      setEditingTask(null);
      setDispatchPrefill(risk.suggestedTask);
      setIsWorkOrderOpen(true);
    } else if (risk.taskId) {
      const target = tasks.find((t) => t.id === risk.taskId);
      if (target) setDetailTask(target);
    }
  };

  const handleDispatchFromMap = useCallback((info: TrackDispatchPayload) => {
    setEditingTask(null);
    setDispatchPrefill({
      title: `Track Inspection — ${info.name}`,
      description: `Scheduled inspection dispatched directly from network map for segment ${info.trackId} (${info.name}).`,
      priority: "Medium",
      trackId: info.trackId,
      trackLabel: info.name,
      lat: info.lat,
      lon: info.lon,
    });
    setIsWorkOrderOpen(true);
  }, []);

  const handleSavedWorkOrder = (savedTask: Task, mode: "create" | "edit") => {
    if (mode === "edit") {
      setTasks((prev) => prev.map((t) => (t.id === savedTask.id ? savedTask : t)));
    } else {
      setTasks((prev) => [savedTask, ...prev]);
      invalidateHistoryCache();
    }
  };

  const nextQuickStatus = (current: string): TaskStatus => {
    const s = current?.toLowerCase();
    if (s === "pending") return "In Progress";
    if (s === "in progress") return "Completed";
    return "Pending";
  };

  return (
    <ProtectedRoute allowedRoles={ALLOWED_ROLES}>
      <div className="min-h-screen bg-[#0d1015] text-gray-200 px-4 py-4 lg:px-6 lg:py-5 space-y-5">
        {/* Operations Control Header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-100 tracking-tight">
                Operations Control Center
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {isAdmin ? "Supervisor Dispatch" : "Field Crew"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Alberta Rail Network · Live weather risk radar, corridor map &
              active work orders
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#151921] hover:bg-[#1e2430] border border-[#242a36] text-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setDispatchPrefill(null);
                  setIsWorkOrderOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                Dispatch Work Order
              </button>
            )}
          </div>
        </header>

        {/* 4-Card Live KPI Strip */}
        <section
          aria-label="Operational Summary Metrics"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <div className="rounded-xl bg-[#151921] border border-[#242a36] p-4 widget-contain">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Active Risk Alerts</span>
              <AlertTriangle
                className={`w-4 h-4 ${
                  metrics.criticalCount > 0
                    ? "text-rose-400"
                    : metrics.highCount > 0
                      ? "text-amber-400"
                      : "text-emerald-400"
                }`}
              />
            </div>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-gray-100">
              {risks.length}
            </p>
            <p className="mt-1 text-[11px] font-mono text-gray-400 tabular-nums">
              {metrics.criticalCount} critical · {metrics.highCount} high
            </p>
          </div>

          <div className="rounded-xl bg-[#151921] border border-[#242a36] p-4 widget-contain">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Open Work Orders</span>
              <ClipboardList className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-gray-100">
              {metrics.totalOpen}
            </p>
            <p className="mt-1 text-[11px] font-mono text-gray-400 tabular-nums">
              {metrics.inProgress} in progress ·{" "}
              <span
                className={
                  metrics.overdue > 0 ? "text-rose-400 font-semibold" : ""
                }
              >
                {metrics.overdue} overdue
              </span>
            </p>
          </div>

          <div className="rounded-xl bg-[#151921] border border-[#242a36] p-4 widget-contain">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Completion Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-gray-100">
              {metrics.completionPct}%
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[#0d1015] overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${metrics.completionPct}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl bg-[#151921] border border-[#242a36] p-4 widget-contain">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Field Crew Roster</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-gray-100">
              {crewUsers.length}
            </p>
            <p className="mt-1 text-[11px] font-mono text-gray-400 tabular-nums">
              {isAdmin ? (
                <Link
                  href="/manageusers"
                  className="text-cyan-400 hover:underline"
                >
                  Manage crew assignments →
                </Link>
              ) : (
                `${myTasksCount} open tasks assigned to you`
              )}
            </p>
          </div>
        </section>

        {/* Primary Split: Risk Radar & Weather Telemetry + Hardware-Accelerated GIS Map */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Left 5 columns: Risk Alerts & Live Corridor Strip */}
          <div className="xl:col-span-5 flex flex-col gap-4">
            <div className="rounded-xl bg-[#151921] border border-[#242a36] p-4 flex flex-col gap-3 widget-contain">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Automated Risk Queue
                </h2>
                <Link
                  href="/weather"
                  className="text-xs font-medium text-cyan-400 hover:underline"
                >
                  Weather Radar →
                </Link>
              </div>

              <div className="space-y-2 max-h-[240px] overflow-y-auto scrollbar-custom pr-1">
                {isLoadingTasks || isLoadingWeather ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-16 rounded-lg bg-[#0d1015] border border-[#242a36] animate-pulse"
                    />
                  ))
                ) : risks.length === 0 ? (
                  <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/30 p-3 text-xs text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    No active weather hazards, overdue work orders, or
                    unassigned risks detected.
                  </div>
                ) : (
                  risks.slice(0, 8).map((risk) => (
                    <div
                      key={risk.id}
                      className="rounded-lg bg-[#0d1015] border border-[#242a36] p-3 flex items-start justify-between gap-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              risk.severity === "critical"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                : risk.severity === "high"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                            }`}
                          >
                            {risk.severity}
                          </span>
                          <span className="text-[11px] font-mono text-gray-500 truncate">
                            {risk.trackLabel}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-gray-100 leading-snug">
                          {risk.title}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
                          {risk.detail}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {risk.suggestedTask && isAdmin && (
                          <button
                            type="button"
                            onClick={() => openDispatchFromRisk(risk)}
                            className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                          >
                            Dispatch
                          </button>
                        )}
                        {risk.taskId && (
                          <button
                            type="button"
                            onClick={() => openDispatchFromRisk(risk)}
                            className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-[#1e2430] hover:bg-[#272f3f] text-gray-200 border border-[#2d3546] transition-colors"
                          >
                            Inspect
                          </button>
                        )}
                        {risk.lat !== undefined && risk.lon !== undefined && (
                          <button
                            type="button"
                            onClick={() => setMapFocus([risk.lat!, risk.lon!])}
                            className="px-2.5 py-1 rounded-md text-[10px] font-mono text-gray-400 hover:text-cyan-300 text-center"
                          >
                            Locate
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 6-Corridor Live Weather Strip */}
            <div className="rounded-xl bg-[#151921] border border-[#242a36] p-4 widget-contain">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-100">
                  Corridor Weather Telemetry
                </h2>
                <span className="text-[11px] font-mono text-gray-500">
                  km/h · °C
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {isLoadingWeather
                  ? Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-20 rounded-lg bg-[#0d1015] border border-[#242a36] animate-pulse"
                      />
                    ))
                  : corridors.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setMapFocus([c.lat, c.lon])}
                        className="text-left rounded-lg bg-[#0d1015] hover:bg-[#191f2a] border border-[#242a36] hover:border-cyan-500/40 p-2.5 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-gray-100 truncate">
                            {c.name.replace(" Subdivision", "")}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              c.riskLevel === "critical"
                                ? "bg-rose-500"
                                : c.riskLevel === "high"
                                  ? "bg-amber-400"
                                  : c.riskLevel === "advisory"
                                    ? "bg-cyan-400"
                                    : "bg-emerald-500"
                            }`}
                          />
                        </div>
                        <div className="mt-1.5 flex items-center gap-2.5 text-xs font-mono tabular-nums text-gray-200">
                          <span className="inline-flex items-center gap-0.5">
                            <Thermometer className="w-3 h-3 text-cyan-400" />
                            {c.degraded ? "-" : `${c.tempC}°C`}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-gray-400">
                            <Wind className="w-3 h-3 text-amber-400" />
                            {c.degraded ? "-" : `${c.windKmh}`}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] text-gray-500 truncate">
                          {c.condition}
                        </p>
                      </button>
                    ))}
              </div>
            </div>
          </div>

          {/* Right 7 columns: Live Railway GIS Map */}
          <div className="xl:col-span-7 min-h-[380px] xl:min-h-[460px]">
            <RailwayMap
              tasks={tasks}
              onTaskSelect={(task) => setDetailTask(task)}
              focusCoords={mapFocus}
              focusZoom={12}
              canDispatch={isAdmin}
              onDispatchTrack={handleDispatchFromMap}
              minHeightClass="min-h-[380px] xl:min-h-[460px]"
            />
          </div>
        </section>

        {/* Bottom Section: Active Work Order Queue with 1-Tap Field Crew Progress */}
        <section
          aria-label="Work Order Dispatch Queue"
          className="rounded-xl bg-[#151921] border border-[#242a36] p-4 space-y-4 widget-contain"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "all", label: `All Orders (${tasks.length})` },
                  { id: "mine", label: `My Tasks (${myTasksCount})` },
                  { id: "pending", label: `Pending (${metrics.pending})` },
                  {
                    id: "in progress",
                    label: `In Progress (${metrics.inProgress})`,
                  },
                  { id: "completed", label: `Completed (${metrics.completed})` },
                ] as { id: QueueFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setQueueFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    queueFilter === tab.id
                      ? "bg-cyan-600 text-white"
                      : "bg-[#0d1015] text-gray-400 hover:text-gray-200 border border-[#242a36]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="search"
                aria-label="Search work orders"
                placeholder="Search ID, track, crew..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg bg-[#0d1015] pl-9 pr-3 py-2 text-xs text-gray-100 border border-[#242a36] focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Work orders table"
            className="table-wrapper max-h-[380px] rounded-lg border border-[#242a36]"
          >
            <table className="responsive-data-table text-left text-xs text-gray-300">
              <thead className="bg-[#10141c] text-[11px] uppercase text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-semibold border-b border-[#242a36]">
                    Order
                  </th>
                  <th className="px-4 py-3 font-semibold border-b border-[#242a36]">
                    Track ID
                  </th>
                  <th className="px-4 py-3 font-semibold border-b border-[#242a36]">
                    Task
                  </th>
                  <th className="px-4 py-3 font-semibold border-b border-[#242a36]">
                    Crew
                  </th>
                  <th className="px-4 py-3 font-semibold border-b border-[#242a36]">
                    Priority
                  </th>
                  <th className="px-4 py-3 font-semibold border-b border-[#242a36]">
                    Window
                  </th>
                  <th className="px-4 py-3 font-semibold border-b border-[#242a36]">
                    Status
                  </th>
                  <th className="px-4 py-3 font-semibold border-b border-[#242a36] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242a36]/60 bg-[#151921]">
                {isLoadingTasks ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-4 py-3" colSpan={8}>
                        <div className="h-5 rounded bg-[#0d1015]" />
                      </td>
                    </tr>
                  ))
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No work orders match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const isCompleted =
                      task.status?.toLowerCase() === "completed";
                    const endDate = formatDateOnly(task.end_date);
                    const isOverdue = Boolean(
                      endDate && endDate < today && !isCompleted
                    );
                    const nextStatus = nextQuickStatus(task.status);
                    const isBusy = updatingTaskId === task.id;

                    return (
                      <tr
                        key={task.id}
                        className="hover:bg-[#1b202b] transition-colors cursor-pointer"
                        onClick={() => setDetailTask(task)}
                      >
                        <td
                          data-label="Order"
                          className="px-4 py-3 font-mono tabular-nums text-gray-200"
                        >
                          #{task.id}
                        </td>
                        <td
                          data-label="Track ID"
                          className="px-4 py-3 font-mono text-cyan-400"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const coords = parseCoordinates(task.coordinates);
                              if (coords) setMapFocus(coords);
                            }}
                            className="hover:underline text-left"
                            title="Focus track on map"
                          >
                            {task.track_id}
                          </button>
                        </td>
                        <td data-label="Task" className="px-4 py-3 max-w-[220px]">
                          <div className="font-medium text-gray-100 truncate">
                            {task.title}
                          </div>
                          <div className="text-[11px] text-gray-500 truncate">
                            {task.description}
                          </div>
                        </td>
                        <td data-label="Crew" className="px-4 py-3 text-gray-200">
                          {task.assigned_to_name ||
                            (task.assigned_to
                              ? `Crew #${task.assigned_to}`
                              : "Unassigned")}
                        </td>
                        <td data-label="Priority" className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              task.priority?.toLowerCase() === "high"
                                ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                                : task.priority?.toLowerCase() === "medium"
                                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                  : "bg-sky-500/10 text-sky-300 border-sky-500/30"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td
                          data-label="Window"
                          className="px-4 py-3 font-mono tabular-nums text-[11px]"
                        >
                          <span className={isOverdue ? "text-rose-400 font-semibold" : "text-gray-300"}>
                            {endDate} {formatTimeShort(task.end_time)}
                          </span>
                        </td>
                        <td data-label="Status" className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              isCompleted
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                : task.status?.toLowerCase() === "in progress"
                                  ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                                  : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            }`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td
                          data-label="Actions"
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleStatusChange(task, nextStatus)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors disabled:opacity-50 ${
                                nextStatus === "Completed"
                                  ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30"
                                  : nextStatus === "In Progress"
                                    ? "bg-cyan-600/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/30"
                                    : "bg-[#1e2430] border-[#2d3546] text-gray-300 hover:bg-[#272f3f]"
                              }`}
                            >
                              {nextStatus === "Completed" && (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              {nextStatus === "In Progress" && (
                                <Play className="w-3 h-3" />
                              )}
                              {nextStatus === "Pending" && (
                                <RotateCcw className="w-3 h-3" />
                              )}
                              {nextStatus === "Completed"
                                ? "Complete"
                                : nextStatus === "In Progress"
                                  ? "Start"
                                  : "Reopen"}
                            </button>

                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  aria-label={`Edit task ${task.id}`}
                                  title="Edit Work Order"
                                  onClick={() => {
                                    setDispatchPrefill(null);
                                    setEditingTask(task);
                                    setIsWorkOrderOpen(true);
                                  }}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Delete task ${task.id}`}
                                  title="Delete Work Order"
                                  onClick={() => setDeleteTarget(task)}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Native Top-Layer Dialogs */}
        <WorkOrderDialog
          isOpen={isWorkOrderOpen}
          onClose={() => {
            setIsWorkOrderOpen(false);
            setEditingTask(null);
            setDispatchPrefill(null);
          }}
          initialTask={editingTask}
          prefill={dispatchPrefill}
          createdByLabel={user?.email || "Supervisor"}
          onSaved={handleSavedWorkOrder}
        />

        <TaskDetailDialog
          isOpen={Boolean(detailTask)}
          onClose={() => setDetailTask(null)}
          task={detailTask}
          isAdmin={isAdmin}
          isUpdating={updatingTaskId === detailTask?.id}
          onStatusChange={handleStatusChange}
          onEdit={(taskToEdit) => {
            setDispatchPrefill(null);
            setEditingTask(taskToEdit);
            setIsWorkOrderOpen(true);
          }}
          onDelete={(taskToDelete) => setDeleteTarget(taskToDelete)}
        />

        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title={
            deleteTarget
              ? `Delete Work Order #${deleteTarget.id}?`
              : "Delete Work Order?"
          }
          message={
            deleteTarget
              ? `This will permanently remove "${deleteTarget.title}" (${deleteTarget.track_id}) from active schedules.`
              : ""
          }
          isBusy={isDeleting}
        />
      </div>
      <AIchatbot />
    </ProtectedRoute>
  );
}
