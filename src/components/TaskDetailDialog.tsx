"use client";
import React from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  UserCheck,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
} from "lucide-react";
import { AppDialog } from "@/components/ui/AppDialog";
import { Task, TaskStatus } from "@/types/task";
import {
  formatDateOnly,
  formatTimeShort,
  getTodayDateString,
} from "@/utils/coordinates";

interface TaskDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  isAdmin: boolean;
  isUpdating?: boolean;
  onStatusChange: (task: Task, nextStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

const STATUS_STEPS: TaskStatus[] = ["Pending", "In Progress", "Completed"];

export default function TaskDetailDialog({
  isOpen,
  onClose,
  task,
  isAdmin,
  isUpdating = false,
  onStatusChange,
  onEdit,
  onDelete,
}: TaskDetailDialogProps) {
  if (!task) {
    return (
      <AppDialog isOpen={false} onClose={onClose} title="Work Order Details">
        <div />
      </AppDialog>
    );
  }

  const startDate = formatDateOnly(task.start_date);
  const endDate = formatDateOnly(task.end_date);
  const startTime = formatTimeShort(task.start_time);
  const endTime = formatTimeShort(task.end_time);
  const today = getTodayDateString();
  const isCompleted = task.status?.toLowerCase() === "completed";
  const isOverdue = Boolean(endDate && endDate < today && !isCompleted);

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Work Order #${task.id}: ${task.title}`}
      subtitle={`Track ${task.track_id || "Unspecified"} · Dispatched by ${task.created_by || "Supervisor"}`}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
              task.priority?.toLowerCase() === "high"
                ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                : task.priority?.toLowerCase() === "medium"
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                  : "bg-sky-500/10 text-sky-300 border-sky-500/30"
            }`}
          >
            {task.priority} Priority
          </span>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isCompleted
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : task.status?.toLowerCase() === "in progress"
                  ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/30"
            }`}
          >
            {task.status}
          </span>

          {isOverdue && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/40">
              <AlertTriangle className="w-3.5 h-3.5" />
              Overdue ({endDate})
            </span>
          )}
        </div>

        <div className="rounded-xl bg-[#0d1015] border border-[#242a36] p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Field Instructions
          </h3>
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
            {task.description}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-[#0d1015] border border-[#242a36] p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              Assigned Crew
            </div>
            <p className="font-medium text-gray-100">
              {task.assigned_to_name ||
                (task.assigned_to ? `Crew #${task.assigned_to}` : "Unassigned")}
            </p>
            {task.assigned_to_email && (
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {task.assigned_to_email}
              </p>
            )}
          </div>

          <div className="rounded-xl bg-[#0d1015] border border-[#242a36] p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Scheduled Window
            </div>
            <p className="font-mono text-xs text-gray-100 tabular-nums">
              {startDate} {startTime}
            </p>
            <p className="font-mono text-xs text-gray-400 tabular-nums mt-0.5">
              to {endDate} {endTime}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-[#0d1015] border border-[#242a36] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Update Field Progress
            </h3>
            <span className="text-[11px] font-mono text-gray-500">
              Syncs immediately
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_STEPS.map((step) => {
              const active = task.status === step;
              return (
                <button
                  key={step}
                  type="button"
                  disabled={active || isUpdating}
                  onClick={() => onStatusChange(task, step)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                    active
                      ? step === "Completed"
                        ? "bg-emerald-600/20 border-emerald-500 text-emerald-200"
                        : step === "In Progress"
                          ? "bg-cyan-600/20 border-cyan-500 text-cyan-200"
                          : "bg-amber-600/20 border-amber-500 text-amber-200"
                      : "bg-[#151921] border-[#242a36] text-gray-300 hover:bg-[#1e2430] hover:text-white disabled:opacity-50"
                  }`}
                >
                  {step === "Pending" && <RotateCcw className="w-3.5 h-3.5" />}
                  {step === "In Progress" && <Play className="w-3.5 h-3.5" />}
                  {step === "Completed" && (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {step}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-[#242a36] flex flex-wrap items-center justify-between gap-2">
          <Link
            href={`/track-overview?track=${encodeURIComponent(String(task.track_id || ""))}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1e2430] text-cyan-300 hover:bg-[#272f3f] border border-[#2d3546] transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            Inspect Track on Map
          </Link>

          <div className="flex items-center gap-2 ml-auto">
            {isAdmin && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(task);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-600/15 text-cyan-300 hover:bg-cyan-600/25 border border-cyan-500/30 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
            {isAdmin && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(task);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-600/15 text-rose-300 hover:bg-rose-600/25 border border-rose-500/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1e2430] text-gray-200 hover:bg-[#272f3f] border border-[#2d3546] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </AppDialog>
  );
}
