"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { AppDialog } from "@/components/ui/AppDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { Task, SubdivisionSummary } from "@/types/task";
import {
  formatDateOnly,
  formatTimeShort,
  getTodayDateString,
  parseCoordinates,
  serializeCoordinates,
} from "@/utils/coordinates";
import {
  fetchUsersCached,
  getCachedUsers,
  updateCachedTask,
} from "@/utils/apiCache";
import {
  getSubdivisionsIndex,
  lookupTrackCoordinates,
} from "@/utils/railwayDataCache";

interface CrewUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface WorkOrderPrefill {
  title?: string;
  description?: string;
  priority?: "Low" | "Medium" | "High";
  status?: "Pending" | "In Progress" | "Completed";
  trackId?: string;
  trackLabel?: string;
  lat?: number;
  lon?: number;
}

interface WorkOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: Task | null;
  prefill?: WorkOrderPrefill | null;
  createdByLabel?: string;
  onSaved: (task: Task, mode: "create" | "edit") => void;
}

const DEFAULT_HUB: [number, number] = [51.0447, -114.0719];

export default function WorkOrderDialog({
  isOpen,
  onClose,
  initialTask,
  prefill,
  createdByLabel = "Supervisor",
  onSaved,
}: WorkOrderDialogProps) {
  const toast = useToast();
  const isEditMode = Boolean(initialTask);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [trackId, setTrackId] = useState("");
  const [trackSearch, setTrackSearch] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(
    null
  );
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("16:00");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [status, setStatus] = useState<"Pending" | "In Progress" | "Completed">(
    "Pending"
  );

  const [users, setUsers] = useState<CrewUser[]>(
    () => (getCachedUsers<CrewUser>() ?? []) as CrewUser[]
  );
  const [subdivisions, setSubdivisions] = useState<SubdivisionSummary[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const today = getTodayDateString();
    setAttemptedSubmit(false);
    setFormError("");
    setShowSuggestions(false);

    if (initialTask) {
      setTitle(initialTask.title || "");
      setDescription(initialTask.description || "");
      setTrackId(String(initialTask.track_id || ""));
      setTrackSearch(String(initialTask.track_id || ""));
      setSelectedCoords(parseCoordinates(initialTask.coordinates));
      setStartDate(formatDateOnly(initialTask.start_date) || today);
      setStartTime(formatTimeShort(initialTask.start_time) || "08:00");
      setEndDate(formatDateOnly(initialTask.end_date) || today);
      setEndTime(formatTimeShort(initialTask.end_time) || "16:00");
      setAssignedTo(
        initialTask.assigned_to ? String(initialTask.assigned_to) : ""
      );
      setPriority(
        (initialTask.priority as "Low" | "Medium" | "High") || "Medium"
      );
      setStatus(
        (initialTask.status as "Pending" | "In Progress" | "Completed") ||
          "Pending"
      );
    } else {
      setTitle(prefill?.title || "");
      setDescription(prefill?.description || "");
      setTrackId(prefill?.trackId || "");
      setTrackSearch(
        prefill?.trackLabel && prefill?.trackId
          ? `${prefill.trackLabel} (${prefill.trackId})`
          : prefill?.trackId || ""
      );
      setSelectedCoords(
        prefill?.lat !== undefined && prefill?.lon !== undefined
          ? [prefill.lat, prefill.lon]
          : null
      );
      setStartDate(today);
      setStartTime("08:00");
      setEndDate(today);
      setEndTime("16:00");
      setAssignedTo("");
      setPriority(prefill?.priority || "Medium");
      setStatus(prefill?.status || "Pending");
    }

    let mounted = true;
    fetchUsersCached<CrewUser>().then((list) => {
      if (mounted) setUsers(list);
    });
    getSubdivisionsIndex()
      .then((subs) => {
        if (mounted) setSubdivisions(subs);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [isOpen, initialTask, prefill]);

  const filteredSubdivisions = useMemo(() => {
    const q = trackSearch.trim().toLowerCase();
    if (!q) return subdivisions.slice(0, 12);
    return subdivisions
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.operator.toLowerCase().includes(q) ||
          s.trackId.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [subdivisions, trackSearch]);

  const handleSelectSubdivision = (sub: SubdivisionSummary) => {
    setTrackId(sub.trackId);
    setTrackSearch(`${sub.name} (${sub.trackId})`);
    setSelectedCoords([sub.lat, sub.lon]);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    setFormError("");

    const cleanTrackId = trackId.trim() || trackSearch.trim();
    if (!title.trim() || !description.trim() || !cleanTrackId || !startDate || !endDate) {
      setFormError("Please complete all required work order fields.");
      return;
    }

    setIsSaving(true);
    try {
      let coords = selectedCoords;
      if (!coords) {
        const lookedUp = await lookupTrackCoordinates(cleanTrackId);
        if (lookedUp && lookedUp.length > 0) {
          const mid = Array.isArray(lookedUp[0])
            ? lookedUp[Math.floor(lookedUp.length / 2)]
            : (lookedUp as unknown as [number, number]);
          // GeoJSON pairs are [lon, lat]
          coords = [Number(mid[1]), Number(mid[0])];
        } else {
          coords = DEFAULT_HUB;
        }
      }

      const serializedCoords = serializeCoordinates(coords[0], coords[1]);
      const assignedNum = assignedTo ? Number(assignedTo) : null;

      if (isEditMode && initialTask) {
        const res = await fetch(`/api/tasks/${initialTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            status,
            assigned_to: assignedNum,
            priority,
            start_date: startDate,
            start_time: startTime || "08:00",
            end_date: endDate,
            end_time: endTime || "16:00",
            track_id: cleanTrackId,
            coordinates: serializedCoords,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "Failed to update work order");
        }

        const updated: Task = await res.json();
        updateCachedTask(updated);
        toast.success(`Work Order #${updated.id} updated.`);
        onSaved(updated, "edit");
        onClose();
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            status,
            assigned_to: assignedNum,
            created_by: createdByLabel,
            start_date: startDate,
            start_time: startTime || "08:00",
            end_date: endDate,
            end_time: endTime || "16:00",
            priority,
            track_id: cleanTrackId,
            coordinates: serializedCoords,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "Failed to create work order");
        }

        const created: Task = await res.json();
        updateCachedTask(created);
        toast.success(`Dispatched Work Order #${created.id}.`);
        onSaved(created, "create");
        onClose();
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to save work order.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      variant="drawer"
      title={
        isEditMode && initialTask
          ? `Edit Work Order #${initialTask.id}`
          : "Dispatch Work Order"
      }
      subtitle="Assign track maintenance, hazard patrols, or inspections to field crews."
      allowLightDismiss={!isSaving}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
            {formError}
          </div>
        )}

        <div>
          <label
            htmlFor="wo-title"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
          >
            Work Order Title *
          </label>
          <input
            id="wo-title"
            type="text"
            required
            autoFocus
            placeholder="e.g. High-Wind Switch Inspection"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full rounded-lg bg-[#0d1015] px-3 py-2.5 text-sm text-gray-100 border focus:outline-none focus:border-cyan-500 ${
              attemptedSubmit && !title.trim()
                ? "border-rose-500"
                : "border-[#242a36]"
            }`}
          />
        </div>

        <div className="relative">
          <label
            htmlFor="wo-track"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
          >
            Corridor / Track ID *
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3 pointer-events-none" />
            <input
              id="wo-track"
              type="text"
              required
              placeholder="Search subdivision (Laggan, Edson...) or enter way/..."
              value={trackSearch}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setTrackSearch(e.target.value);
                setTrackId(e.target.value);
                setSelectedCoords(null);
                setShowSuggestions(true);
              }}
              className={`w-full rounded-lg bg-[#0d1015] pl-9 pr-3 py-2.5 text-sm text-gray-100 border focus:outline-none focus:border-cyan-500 ${
                attemptedSubmit && !(trackId.trim() || trackSearch.trim())
                  ? "border-rose-500"
                  : "border-[#242a36]"
              }`}
            />
          </div>

          {selectedCoords && (
            <p className="mt-1 text-[11px] font-mono text-cyan-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Selected: {trackId} ({selectedCoords[0].toFixed(4)},{" "}
              {selectedCoords[1].toFixed(4)})
            </p>
          )}

          {showSuggestions && filteredSubdivisions.length > 0 && (
            <div className="mt-1 max-h-48 overflow-y-auto scrollbar-custom rounded-lg bg-[#0d1015] border border-[#2d3546] shadow-xl">
              {filteredSubdivisions.map((sub) => (
                <button
                  key={`${sub.trackId}-${sub.name}`}
                  type="button"
                  onClick={() => handleSelectSubdivision(sub)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-[#1b202b] border-b border-[#242a36]/50 last:border-b-0 flex items-center justify-between gap-2"
                >
                  <span className="min-w-0">
                    <span className="font-medium text-gray-100 block truncate">
                      {sub.name}
                    </span>
                    <span className="text-[11px] text-gray-400 block truncate">
                      {sub.operator || "Alberta Rail"} · {sub.count} segments
                    </span>
                  </span>
                  <span className="font-mono text-[11px] text-cyan-400 flex-shrink-0">
                    {sub.trackId}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="wo-desc"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
          >
            Instructions & Scope *
          </label>
          <textarea
            id="wo-desc"
            rows={3}
            required
            placeholder="Describe safety checks, required equipment, or hazard details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full rounded-lg bg-[#0d1015] px-3 py-2 text-sm text-gray-100 border focus:outline-none focus:border-cyan-500 ${
              attemptedSubmit && !description.trim()
                ? "border-rose-500"
                : "border-[#242a36]"
            }`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="wo-start-date"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
            >
              Start Window *
            </label>
            <div className="flex gap-2">
              <input
                id="wo-start-date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg bg-[#0d1015] px-2.5 py-2 text-xs text-gray-100 border border-[#242a36] focus:outline-none focus:border-cyan-500"
              />
              <input
                aria-label="Start time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-28 rounded-lg bg-[#0d1015] px-2.5 py-2 text-xs text-gray-100 border border-[#242a36] focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="wo-end-date"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
            >
              Due Window *
            </label>
            <div className="flex gap-2">
              <input
                id="wo-end-date"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg bg-[#0d1015] px-2.5 py-2 text-xs text-gray-100 border border-[#242a36] focus:outline-none focus:border-cyan-500"
              />
              <input
                aria-label="End time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-28 rounded-lg bg-[#0d1015] px-2.5 py-2 text-xs text-gray-100 border border-[#242a36] focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label
              htmlFor="wo-priority"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
            >
              Priority
            </label>
            <select
              id="wo-priority"
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as "Low" | "Medium" | "High")
              }
              className="w-full rounded-lg bg-[#0d1015] px-3 py-2.5 text-sm text-gray-100 border border-[#242a36] focus:outline-none focus:border-cyan-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="sm:col-span-1">
            <label
              htmlFor="wo-status"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
            >
              Status
            </label>
            <select
              id="wo-status"
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as "Pending" | "In Progress" | "Completed"
                )
              }
              className="w-full rounded-lg bg-[#0d1015] px-3 py-2.5 text-sm text-gray-100 border border-[#242a36] focus:outline-none focus:border-cyan-500"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="sm:col-span-1">
            <label
              htmlFor="wo-assignee"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
            >
              Assign Crew
            </label>
            <select
              id="wo-assignee"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full rounded-lg bg-[#0d1015] px-3 py-2.5 text-sm text-gray-100 border border-[#242a36] focus:outline-none focus:border-cyan-500"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role || u.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-[#242a36] flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#1e2430] text-gray-200 hover:bg-[#272f3f] border border-[#2d3546] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-cyan-600 text-white hover:bg-cyan-500 transition-colors disabled:opacity-50"
          >
            {isSaving
              ? "Saving..."
              : isEditMode
                ? "Save Changes"
                : "Dispatch Order"}
          </button>
        </div>
      </form>
    </AppDialog>
  );
}
