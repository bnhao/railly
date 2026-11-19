"use client";
import React, { memo, useEffect, useMemo, useState } from "react";
import {
  Wind,
  Thermometer,
  Compass,
  Droplets,
  AlertTriangle,
  Plus,
  CloudSun,
  Map as MapIcon,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { SparkAreaChart } from "@/components/ui/MiniCharts";
import WorkOrderDialog, {
  WorkOrderPrefill,
} from "@/components/WorkOrderDialog";
import {
  fetchCorridorWeatherCached,
  fetchPointWeatherCached,
  fetchTasksCached,
  getCachedCorridorWeather,
  getCachedTasks,
  invalidateHistoryCache,
} from "@/utils/apiCache";
import { getCompassDirection, parseCoordinates } from "@/utils/coordinates";
import { CorridorWeatherSnapshot } from "@/utils/riskEngine";
import { Task } from "@/types/task";

interface SelectLocationProps {
  selectedId: string;
  onSelectCorridor: (id: string) => void;
}

const SelectLocation = ({
  selectedId,
  onSelectCorridor,
}: SelectLocationProps) => {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";

  const [corridors, setCorridors] = useState<CorridorWeatherSnapshot[]>(
    () => getCachedCorridorWeather() ?? []
  );
  const [tasks, setTasks] = useState<Task[]>(() => getCachedTasks<Task>() ?? []);
  const [taskWeather, setTaskWeather] =
    useState<CorridorWeatherSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(
    () => !getCachedCorridorWeather()
  );
  const [showRadar, setShowRadar] = useState(false);

  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [dispatchPrefill, setDispatchPrefill] =
    useState<WorkOrderPrefill | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchCorridorWeatherCached(), fetchTasksCached<Task>()]).then(
      ([wxList, taskList]) => {
        if (!mounted) return;
        setCorridors(wxList);
        setTasks(taskList);
        setLoading(false);
        if (!selectedId && wxList.length > 0) {
          onSelectCorridor(wxList[0].id);
        }
      }
    );
    return () => {
      mounted = false;
    };
  }, [selectedId, onSelectCorridor]);

  // If user selects a custom task track from dropdown, fetch its live forecast too
  const activeCorridor = useMemo(() => {
    const found = corridors.find(
      (c) => c.id === selectedId || c.trackId === selectedId
    );
    if (found) return found;
    if (taskWeather && taskWeather.trackId === selectedId) return taskWeather;
    return corridors[0] || null;
  }, [corridors, selectedId, taskWeather]);

  useEffect(() => {
    setShowRadar(false);
  }, [activeCorridor?.id, activeCorridor?.trackId]);

  const handleTaskTrackDropdown = async (trackId: string) => {
    if (!trackId) return;
    onSelectCorridor(trackId);
    const existing = corridors.find(
      (c) => c.id === trackId || c.trackId === trackId
    );
    if (existing) return;

    const task = tasks.find((t) => String(t.track_id) === trackId);
    const coords = parseCoordinates(task?.coordinates);
    if (!coords) return;

    const pointSnap = await fetchPointWeatherCached(
      coords[0],
      coords[1],
      trackId,
      task?.title ? `${trackId} — ${task.title}` : trackId
    );
    if (pointSnap) {
      setTaskWeather(pointSnap);
    }
  };

  const windSeries = useMemo(() => {
    if (!activeCorridor?.series) return [];
    return activeCorridor.series.map((p) => ({
      label: p.time,
      value: p.windKmh,
      secondaryValue: p.gustKmh,
    }));
  }, [activeCorridor]);

  const tempSeries = useMemo(() => {
    if (!activeCorridor?.series) return [];
    return activeCorridor.series.map((p) => ({
      label: p.time,
      value: p.tempC,
    }));
  }, [activeCorridor]);

  const radarUrl = activeCorridor
    ? `https://www.meteoblue.com/en/weather/maps/widget?lat=${activeCorridor.lat}&lon=${activeCorridor.lon}&zoom=8&tempunit=C&windunit=km/h&lengthunit=metric`
    : "";

  const openDispatch = (snap: CorridorWeatherSnapshot) => {
    const firstRisk = snap.risks[0]?.suggestedTask;
    setDispatchPrefill(
      firstRisk ?? {
        title: `Weather Corridor Inspection — ${snap.name}`,
        description: `Corridor condition check on ${snap.name} (${snap.trackId}): ${snap.tempC}°C, wind ${snap.windKmh} km/h (gusts ${snap.gustKmh} km/h).`,
        priority: snap.riskLevel === "critical" || snap.riskLevel === "high" ? "High" : "Medium",
        trackId: snap.trackId,
        trackLabel: snap.name,
        lat: snap.lat,
        lon: snap.lon,
      }
    );
    setIsDispatchOpen(true);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-100 tracking-tight">
            Railway Weather & Hazard Telemetry
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Live 48-hour corridor telemetry evaluated against rail thermal &
            crosswind limits.
          </p>
        </div>

        <select
          aria-label="Inspect weather for a specific corridor or active task track"
          value={selectedId}
          onChange={(e) => void handleTaskTrackDropdown(e.target.value)}
          className="rounded-lg bg-[#151921] border border-[#242a36] px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">Select Corridor or Track...</option>
          {corridors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.windKmh} km/h · {c.tempC}°C)
            </option>
          ))}
          {tasks.map((t) => (
            <option key={`task-${t.id}`} value={String(t.track_id)}>
              Order #{t.id} · {t.track_id} ({t.title})
            </option>
          ))}
        </select>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left 4 columns: Corridor Weather Cards */}
        <div className="xl:col-span-4 space-y-2.5">
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-24 rounded-xl bg-[#151921] border border-[#242a36] animate-pulse"
                />
              ))
            : corridors.map((c, idx) => {
                const isSelected = activeCorridor?.id === c.id;
                return (
                  <div
                    key={c.id}
                    className={`rounded-xl p-4 bg-[#151921] border transition-colors cursor-pointer ${
                      isSelected
                        ? "border-cyan-500 bg-[#18202c]"
                        : "border-[#242a36] hover:bg-[#1b202b]"
                    } ${idx >= 5 ? "deferred-card" : ""}`}
                    onClick={() => onSelectCorridor(c.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-semibold text-gray-100">
                          {c.name}
                        </h2>
                        <p className="text-[11px] text-gray-400">
                          {c.operator} · {c.region}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${
                          c.riskLevel === "critical"
                            ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
                            : c.riskLevel === "high"
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                              : c.riskLevel === "advisory"
                                ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
                                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {c.riskLevel}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums text-gray-200">
                      <span className="inline-flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                        {c.degraded ? "-" : `${c.tempC}°C`}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Wind className="w-3.5 h-3.5 text-amber-400" />
                        {c.degraded
                          ? "-"
                          : `${c.windKmh} km/h (${getCompassDirection(c.windDeg)})`}
                      </span>
                      <span className="text-gray-400">{c.condition}</span>
                    </div>
                  </div>
                );
              })}
        </div>

        {/* Right 8 columns: Active Corridor Telemetry & Charts */}
        <div className="xl:col-span-8 space-y-4">
          {activeCorridor && (
            <>
              <div className="rounded-xl bg-[#151921] border border-[#242a36] p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-100">
                    {activeCorridor.name}
                  </h2>
                  <p className="text-xs font-mono text-cyan-400">
                    {activeCorridor.trackId} · {activeCorridor.operator} ·{" "}
                    {activeCorridor.description}
                  </p>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => openDispatch(activeCorridor)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Dispatch Corridor Check
                  </button>
                )}
              </div>

              {/* Active Weather Hazard Banner */}
              {activeCorridor.risks.length > 0 && (
                <div className="rounded-xl bg-amber-950/25 border border-amber-500/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    Evaluated Rail Safety Advisories
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-200">
                    {activeCorridor.risks.map((r) => (
                      <li key={r.id}>
                        <strong className="text-amber-200">{r.title}:</strong>{" "}
                        {r.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 4 KPI Telemetry Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-[#151921] border border-[#242a36] p-3.5 widget-contain">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-cyan-400" /> Temp
                  </span>
                  <p className="mt-1.5 text-xl font-bold font-mono tabular-nums text-gray-100">
                    {activeCorridor.tempC}°C
                  </p>
                  <p className="text-[11px] text-gray-500 font-mono">
                    Feels {activeCorridor.feelsLikeC}°C
                  </p>
                </div>

                <div className="rounded-xl bg-[#151921] border border-[#242a36] p-3.5 widget-contain">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-amber-400" /> Wind / Gust
                  </span>
                  <p className="mt-1.5 text-xl font-bold font-mono tabular-nums text-gray-100">
                    {activeCorridor.windKmh} km/h
                  </p>
                  <p className="text-[11px] text-amber-400 font-mono">
                    Gusts {activeCorridor.gustKmh} km/h
                  </p>
                </div>

                <div className="rounded-xl bg-[#151921] border border-[#242a36] p-3.5 widget-contain">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" /> Bearing
                  </span>
                  <p className="mt-1.5 text-xl font-bold font-mono text-gray-100">
                    {getCompassDirection(activeCorridor.windDeg)}
                  </p>
                  <p className="text-[11px] text-gray-500 font-mono tabular-nums">
                    {activeCorridor.windDeg}°
                  </p>
                </div>

                <div className="rounded-xl bg-[#151921] border border-[#242a36] p-3.5 widget-contain">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Humidity
                  </span>
                  <p className="mt-1.5 text-xl font-bold font-mono tabular-nums text-gray-100">
                    {activeCorridor.humidity}%
                  </p>
                  <p className="text-[11px] text-gray-500 font-mono">
                    Precip {activeCorridor.precipMm} mm
                  </p>
                </div>
              </div>

              {/* 48h Native SVG Telemetry Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl bg-[#151921] border border-[#242a36] p-4 widget-contain space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    48h Wind & Gust Forecast (km/h)
                  </h3>
                  <SparkAreaChart
                    data={windSeries}
                    unit=" km/h"
                    primaryLabel="Wind"
                    secondaryLabel="Gust"
                    accentColor="#06b6d4"
                    thresholdValue={45}
                    thresholdLabel="45 km/h Patrol Limit"
                  />
                </div>

                <div className="rounded-xl bg-[#151921] border border-[#242a36] p-4 widget-contain space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    48h Thermal Forecast (°C)
                  </h3>
                  <SparkAreaChart
                    data={tempSeries}
                    unit="°C"
                    primaryLabel="Temp"
                    accentColor="#38bdf8"
                    thresholdValue={-20}
                    thresholdLabel="-20°C Cold Stress"
                  />
                </div>
              </div>

              {/* Click-to-Load Meteoblue Radar (Zero automatic third-party slowdown) */}
              <div className="rounded-xl bg-[#151921] border border-[#242a36] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <CloudSun className="w-4 h-4 text-cyan-400" />
                    Regional Meteoblue Radar Map
                  </h3>
                  {!showRadar ? (
                    <button
                      type="button"
                      onClick={() => setShowRadar(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1e2430] hover:bg-[#272f3f] text-cyan-300 border border-[#2d3546] transition-colors"
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      Load Interactive Radar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowRadar(false)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Unload Radar
                    </button>
                  )}
                </div>

                {showRadar ? (
                  <iframe
                    src={radarUrl}
                    frameBorder="0"
                    scrolling="no"
                    loading="lazy"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
                    style={{
                      width: "100%",
                      height: "360px",
                      borderRadius: "10px",
                    }}
                    title={`Meteoblue Weather Radar for ${activeCorridor.name}`}
                  />
                ) : (
                  <p className="text-xs text-gray-500">
                    Third-party satellite radar loads on demand to keep field
                    devices fast and conserve bandwidth.
                  </p>
                )}
              </div>
            </>
          )}
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
        onSaved={() => {
          invalidateHistoryCache();
        }}
      />
    </div>
  );
};

export default memo(SelectLocation);
