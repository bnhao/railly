"use client";
import React, { useMemo } from "react";
import { Download, Printer } from "lucide-react";
import { AppDialog } from "@/components/ui/AppDialog";
import { BarBreakdownChart } from "@/components/ui/MiniCharts";
import { Task } from "@/types/task";
import { formatDateOnly } from "@/utils/coordinates";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

const getWeekDates = () => {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const week: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    week.push(`${y}-${m}-${dd}`);
  }
  return week;
};

export default function ReportModal({
  isOpen,
  onClose,
  tasks,
}: ReportModalProps) {
  const weekDates = useMemo(() => getWeekDates(), []);

  const summary = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    const crewMap = new Map<
      string,
      { pending: number; inProgress: number; completed: number }
    >();

    for (const t of tasks) {
      const s = t.status?.toLowerCase();
      const crew =
        t.assigned_to_name ||
        (t.assigned_to ? `Crew #${t.assigned_to}` : "Unassigned");
      const entry = crewMap.get(crew) || {
        pending: 0,
        inProgress: 0,
        completed: 0,
      };

      if (s === "completed") {
        completed++;
        entry.completed++;
      } else if (s === "in progress") {
        inProgress++;
        entry.inProgress++;
      } else {
        pending++;
        entry.pending++;
      }
      crewMap.set(crew, entry);
    }

    return {
      total: tasks.length,
      pending,
      inProgress,
      completed,
      crewBreakdown: Array.from(crewMap.entries()).map(([name, counts]) => ({
        name,
        ...counts,
      })),
    };
  }, [tasks]);

  const weeklyBarItems = useMemo(() => {
    const byDate = new Map<
      string,
      { inProgress: number; pending: number; completed: number }
    >();
    for (const t of tasks) {
      const d = formatDateOnly(t.start_date);
      if (!d) continue;
      const bucket = byDate.get(d) || {
        inProgress: 0,
        pending: 0,
        completed: 0,
      };
      const s = t.status?.toLowerCase();
      if (s === "completed") bucket.completed++;
      else if (s === "in progress") bucket.inProgress++;
      else bucket.pending++;
      byDate.set(d, bucket);
    }

    return weekDates.map((iso) => {
      const b = byDate.get(iso);
      return {
        label: iso.slice(5),
        primary: b?.inProgress ?? 0,
        secondary: b?.pending ?? 0,
        tertiary: b?.completed ?? 0,
      };
    });
  }, [tasks, weekDates]);

  const handleDownloadCsv = () => {
    const headers = [
      "Order ID",
      "Title",
      "Track ID",
      "Priority",
      "Status",
      "Assigned Crew",
      "Start Date",
      "End Date",
    ];
    const rows = tasks.map((t) => [
      t.id,
      `"${String(t.title || "").replace(/"/g, '""')}"`,
      `"${String(t.track_id || "").replace(/"/g, '""')}"`,
      t.priority,
      t.status,
      `"${String(t.assigned_to_name || t.assigned_to || "Unassigned").replace(/"/g, '""')}"`,
      formatDateOnly(t.start_date),
      formatDateOnly(t.end_date),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `railly-shift-report-${weekDates[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Operations Shift & Workload Report"
      subtitle={`Current week (${weekDates[0]} to ${weekDates[6]}) · Vector printable & CSV exportable`}
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-[#0d1015] border border-[#242a36] p-3">
            <p className="text-[11px] text-gray-400">Total Orders</p>
            <p className="text-xl font-bold font-mono tabular-nums text-gray-100 mt-1">
              {summary.total}
            </p>
          </div>
          <div className="rounded-lg bg-[#0d1015] border border-[#242a36] p-3">
            <p className="text-[11px] text-gray-400">In Progress</p>
            <p className="text-xl font-bold font-mono tabular-nums text-cyan-400 mt-1">
              {summary.inProgress}
            </p>
          </div>
          <div className="rounded-lg bg-[#0d1015] border border-[#242a36] p-3">
            <p className="text-[11px] text-gray-400">Pending</p>
            <p className="text-xl font-bold font-mono tabular-nums text-amber-400 mt-1">
              {summary.pending}
            </p>
          </div>
          <div className="rounded-lg bg-[#0d1015] border border-[#242a36] p-3">
            <p className="text-[11px] text-gray-400">Completed</p>
            <p className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
              {summary.completed}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-[#0d1015] border border-[#242a36] p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Weekly Work Order Distribution
          </h3>
          <BarBreakdownChart
            items={weeklyBarItems}
            primaryLabel="In Progress"
            secondaryLabel="Pending"
            tertiaryLabel="Completed"
          />
        </div>

        <div className="rounded-xl bg-[#0d1015] border border-[#242a36] p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Crew Workload Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead>
                <tr className="border-b border-[#242a36] text-gray-400">
                  <th className="py-2 pr-3">Crew Member</th>
                  <th className="py-2 px-3 font-mono text-right">Pending</th>
                  <th className="py-2 px-3 font-mono text-right">In Progress</th>
                  <th className="py-2 pl-3 font-mono text-right">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242a36]/50">
                {summary.crewBreakdown.map((row) => (
                  <tr key={row.name}>
                    <td className="py-2 pr-3 font-medium text-gray-100">
                      {row.name}
                    </td>
                    <td className="py-2 px-3 font-mono tabular-nums text-right text-amber-400">
                      {row.pending}
                    </td>
                    <td className="py-2 px-3 font-mono tabular-nums text-right text-cyan-400">
                      {row.inProgress}
                    </td>
                    <td className="py-2 pl-3 font-mono tabular-nums text-right text-emerald-400">
                      {row.completed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2 no-print">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#1e2430] text-gray-200 hover:bg-[#272f3f] border border-[#2d3546] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </div>
    </AppDialog>
  );
}
