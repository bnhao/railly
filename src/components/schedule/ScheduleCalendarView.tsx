"use client";
import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Task } from "@/types/task";
import { formatDateOnly, formatTimeShort } from "@/utils/coordinates";

interface ScheduleCalendarViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonday(baseDate: Date): Date {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ScheduleCalendarView({
  tasks,
  onSelectTask,
}: ScheduleCalendarViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDays = useMemo(() => {
    const monday = getMonday(new Date());
    monday.setDate(monday.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return {
        label: DAY_NAMES[i],
        iso: toIsoDate(date),
        displayDate: date.toLocaleDateString("en-CA", {
          month: "short",
          day: "numeric",
        }),
      };
    });
  }, [weekOffset]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const day of weekDays) {
      map.set(day.iso, []);
    }

    for (const task of tasks) {
      const start = formatDateOnly(task.start_date);
      const end = formatDateOnly(task.end_date) || start;
      if (!start) continue;

      for (const day of weekDays) {
        if (day.iso >= start && day.iso <= end) {
          map.get(day.iso)?.push(task);
        }
      }
    }
    return map;
  }, [tasks, weekDays]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#151921] border border-[#242a36] px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-100">
            7-Day Shift Dispatch Board
          </h2>
          <p className="text-xs font-mono text-gray-400">
            {weekDays[0]?.displayDate} — {weekDays[6]?.displayDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w - 1)}
            aria-label="Previous week"
            className="p-2 rounded-lg bg-[#0d1015] border border-[#242a36] text-gray-300 hover:text-white hover:bg-[#1e2430]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="px-3 py-1.5 rounded-lg bg-[#0d1015] border border-[#242a36] text-xs font-semibold text-gray-200 hover:bg-[#1e2430]"
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w + 1)}
            aria-label="Next week"
            className="p-2 rounded-lg bg-[#0d1015] border border-[#242a36] text-gray-300 hover:text-white hover:bg-[#1e2430]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dayTasks = tasksByDay.get(day.iso) ?? [];
          const isToday = day.iso === toIsoDate(new Date());

          return (
            <div
              key={day.iso}
              className={`rounded-xl bg-[#151921] border p-3 flex flex-col gap-2 min-h-[180px] widget-contain ${
                isToday ? "border-cyan-500/60" : "border-[#242a36]"
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#242a36]">
                <span
                  className={`text-xs font-bold uppercase ${
                    isToday ? "text-cyan-400" : "text-gray-300"
                  }`}
                >
                  {day.label}
                </span>
                <span className="text-[11px] font-mono text-gray-400">
                  {day.displayDate}
                </span>
              </div>

              {dayTasks.length === 0 ? (
                <p className="text-[11px] text-gray-500 italic my-auto text-center">
                  No orders
                </p>
              ) : (
                <div className="space-y-2">
                  {dayTasks.map((task) => {
                    const isCompleted =
                      task.status?.toLowerCase() === "completed";
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => onSelectTask(task)}
                        className={`w-full text-left rounded-lg p-2 bg-[#0d1015] hover:bg-[#1b202b] border transition-colors ${
                          isCompleted
                            ? "border-emerald-500/30 opacity-80"
                            : task.priority?.toLowerCase() === "high"
                              ? "border-rose-500/40"
                              : "border-[#242a36]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-gray-400">
                          <span>#{task.id}</span>
                          <span>{formatTimeShort(task.start_time)}</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-100 truncate mt-0.5">
                          {task.title}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">
                          {task.assigned_to_name || "Unassigned"} ·{" "}
                          <span
                            className={
                              isCompleted
                                ? "text-emerald-400"
                                : task.status?.toLowerCase() === "in progress"
                                  ? "text-cyan-400"
                                  : "text-amber-400"
                            }
                          >
                            {task.status}
                          </span>
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
