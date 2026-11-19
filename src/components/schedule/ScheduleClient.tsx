"use client";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MapPin,
  Edit2,
  Trash2,
  Plus,
  FileBarChart2,
  Search,
  CheckCircle2,
  Play,
  RotateCcw,
  Calendar,
  Table2,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ConfirmDialog } from "@/components/ui/AppDialog";
import { useToast } from "@/components/ui/ToastProvider";
import WorkOrderDialog from "@/components/WorkOrderDialog";
import TaskDetailDialog from "@/components/TaskDetailDialog";
import { Task, TaskStatus } from "@/types/task";
import {
  fetchTasksCached,
  getCachedTasks,
  invalidateHistoryCache,
  removeCachedTask,
  updateCachedTask,
} from "@/utils/apiCache";
import {
  formatDateOnly,
  formatTimeShort,
  getTodayDateString,
} from "@/utils/coordinates";

const ScheduleCalendarView = dynamic(
  () => import("@/components/schedule/ScheduleCalendarView"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-[#151921] rounded-xl border border-[#242a36] text-xs font-mono text-gray-400">
        Loading 7-Day Dispatch Board...
      </div>
    ),
  }
);

const ReportModal = dynamic(() => import("@/components/ReportModal"), {
  ssr: false,
  loading: () => null,
});

export type ScheduleTask = Task;

const ALLOWED_ROLES = ["admin", "user"];

export default function ScheduleClient() {
  const { user, role } = useAuth();
  const toast = useToast();
  const isAdmin = role === "admin";

  const [tasks, setTasks] = useState<Task[]>(() => getCachedTasks<Task>() ?? []);
  const [loading, setLoading] = useState<boolean>(() => !getCachedTasks<Task>());
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  const [scopeFilter, setScopeFilter] = useState<"all" | "mine">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchTasksCached<Task>().then((fetched) => {
      if (!mounted) return;
      setTasks(fetched);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const userEmailLower = user?.email?.toLowerCase() || "";
  const today = getTodayDateString();

  const filteredTasks = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return tasks.filter((t) => {
      if (scopeFilter === "mine") {
        if (!userEmailLower || t.assigned_to_email?.toLowerCase() !== userEmailLower) {
          return false;
        }
      }
      if (
        statusFilter !== "all" &&
        t.status?.toLowerCase() !== statusFilter.toLowerCase()
      ) {
        return false;
      }
      if (
        priorityFilter !== "all" &&
        t.priority?.toLowerCase() !== priorityFilter.toLowerCase()
      ) {
        return false;
      }
      if (!q) return true;
      return (
        String(t.id).includes(q) ||
        t.title?.toLowerCase().includes(q) ||
        t.track_id?.toLowerCase().includes(q) ||
        t.assigned_to_name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    });
  }, [tasks, scopeFilter, statusFilter, priorityFilter, deferredSearch, userEmailLower]);

  const handleStatusChange = useCallback(
    async (task: Task, nextStatus: TaskStatus) => {
      if (task.status === nextStatus) return;
      const previous = task;
      const optimistic: Task = { ...task, status: nextStatus };

      setUpdatingTaskId(task.id);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? optimistic : t)));
      if (selectedTask?.id === task.id) setSelectedTask(optimistic);
      updateCachedTask(optimistic);

      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (!res.ok) throw new Error("Failed update");
        const saved: Task = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
        if (selectedTask?.id === saved.id) setSelectedTask(saved);
        updateCachedTask(saved);
        toast.success(`Work Order #${saved.id} -> ${saved.status}`);
      } catch {
        setTasks((prev) => prev.map((t) => (t.id === previous.id ? previous : t)));
        if (selectedTask?.id === previous.id) setSelectedTask(previous);
        updateCachedTask(previous);
        toast.error("Failed to save status change.");
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [selectedTask, toast]
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed delete");

      removeCachedTask(deleteTarget.id);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      if (selectedTask?.id === deleteTarget.id) setSelectedTask(null);
      toast.success(`Deleted Work Order #${deleteTarget.id}.`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete work order.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavedTask = (saved: Task, mode: "create" | "edit") => {
    if (mode === "edit") {
      setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
    } else {
      setTasks((prev) => [saved, ...prev]);
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
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-100 tracking-tight">
              Crew Work Schedule
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Assign railway tasks, update field progress in real time, and
              export shift reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 rounded-lg font-semibold text-xs text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Schedule Task
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-[#151921] border border-cyan-500/30 text-cyan-300 hover:bg-[#1e2430] px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors"
                >
                  <FileBarChart2 className="w-4 h-4" />
                  Shift Report
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() =>
                setViewMode((prev) => (prev === "calendar" ? "table" : "calendar"))
              }
              className="inline-flex items-center gap-1.5 bg-[#151921] border border-[#242a36] px-3.5 py-2 rounded-lg font-semibold text-xs text-gray-200 hover:bg-[#1e2430] transition-colors"
            >
              {viewMode === "calendar" ? (
                <>
                  <Table2 className="w-4 h-4 text-cyan-400" />
                  Table View
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  Week Board
                </>
              )}
            </button>
          </div>
        </header>

        {/* Unified Filters */}
        <section className="rounded-xl bg-[#151921] border border-[#242a36] p-3.5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setScopeFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                scopeFilter === "all"
                  ? "bg-cyan-600 text-white"
                  : "bg-[#0d1015] text-gray-400 hover:text-gray-200 border border-[#242a36]"
              }`}
            >
              All Tasks
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter("mine")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                scopeFilter === "mine"
                  ? "bg-cyan-600 text-white"
                  : "bg-[#0d1015] text-gray-400 hover:text-gray-200 border border-[#242a36]"
              }`}
            >
              Assigned to Me
            </button>
          </div>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg bg-[#0d1015] border border-[#242a36] px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg bg-[#0d1015] border border-[#242a36] px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2 pointer-events-none" />
            <input
              type="search"
              aria-label="Search scheduled tasks"
              placeholder="Search title, crew name, or track..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-[#0d1015] border border-[#242a36] pl-9 pr-3 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </section>

        {viewMode === "calendar" ? (
          <ScheduleCalendarView
            tasks={filteredTasks}
            onSelectTask={setSelectedTask}
          />
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-label="Scheduled railway work orders"
            className="table-wrapper rounded-xl border border-[#242a36] bg-[#151921]"
          >
            <table className="responsive-data-table text-left text-xs text-gray-300">
              <thead className="bg-[#10141c] text-[11px] uppercase text-gray-400">
                <tr>
                  <th className="px-4 py-3.5 font-semibold border-b border-[#242a36]">
                    Order
                  </th>
                  <th className="px-4 py-3.5 font-semibold border-b border-[#242a36]">
                    Track ID
                  </th>
                  <th className="px-4 py-3.5 font-semibold border-b border-[#242a36]">
                    Title & Details
                  </th>
                  <th className="px-4 py-3.5 font-semibold border-b border-[#242a36]">
                    Assigned Crew
                  </th>
                  <th className="px-4 py-3.5 font-semibold border-b border-[#242a36]">
                    Schedule Window
                  </th>
                  <th className="px-4 py-3.5 font-semibold border-b border-[#242a36]">
                    Status
                  </th>
                  <th className="px-4 py-3.5 font-semibold border-b border-[#242a36] text-center">
                    Map
                  </th>
                  <th className="px-4 py-3.5 font-semibold border-b border-[#242a36] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242a36]/60">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="h-5 rounded bg-[#0d1015]" />
                      </td>
                    </tr>
                  ))
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      No scheduled work orders match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const startD = formatDateOnly(task.start_date);
                    const endD = formatDateOnly(task.end_date);
                    const isCompleted =
                      task.status?.toLowerCase() === "completed";
                    const isOverdue = Boolean(endD && endD < today && !isCompleted);
                    const nextStatus = nextQuickStatus(task.status);
                    const isBusy = updatingTaskId === task.id;

                    return (
                      <tr
                        key={task.id}
                        className="hover:bg-[#1b202b] transition-colors cursor-pointer"
                        onClick={() => setSelectedTask(task)}
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
                          {task.track_id}
                        </td>
                        <td data-label="Title" className="px-4 py-3 max-w-[230px]">
                          <div className="font-medium text-gray-100 truncate">
                            {task.title}
                          </div>
                          <div className="text-[11px] text-gray-500 truncate">
                            {task.description}
                          </div>
                        </td>
                        <td
                          data-label="Crew"
                          className="px-4 py-3 text-gray-200"
                        >
                          {task.assigned_to_name ||
                            (task.assigned_to
                              ? `Crew #${task.assigned_to}`
                              : "Unassigned")}
                        </td>
                        <td
                          data-label="Schedule"
                          className="px-4 py-3 font-mono tabular-nums text-[11px]"
                        >
                          <div className={isOverdue ? "text-rose-400 font-semibold" : "text-gray-200"}>
                            {startD} to {endD}
                            {isOverdue ? " (Overdue)" : ""}
                          </div>
                          <div className="text-gray-500">
                            {formatTimeShort(task.start_time)} –{" "}
                            {formatTimeShort(task.end_time)}
                          </div>
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
                          data-label="Map"
                          className="px-4 py-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/track-overview?track=${encodeURIComponent(String(task.track_id || ""))}`}
                            className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-colors"
                            aria-label={`Inspect track ${task.track_id} on map`}
                            title="Inspect track on map"
                          >
                            <MapPin className="w-4 h-4" />
                          </Link>
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
                                  aria-label={`Edit Task ${task.id}`}
                                  title="Edit Work Order"
                                  onClick={() => {
                                    setEditingTask(task);
                                    setIsModalOpen(true);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Delete Task ${task.id}`}
                                  title="Delete Work Order"
                                  onClick={() => setDeleteTarget(task)}
                                  className="p-1.5 text-gray-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
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
        )}

        <WorkOrderDialog
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          initialTask={editingTask}
          createdByLabel={user?.email || "Supervisor"}
          onSaved={handleSavedTask}
        />

        {role === "admin" && isReportOpen && (
          <ReportModal
            isOpen={isReportOpen}
            onClose={() => setIsReportOpen(false)}
            tasks={tasks}
          />
        )}

        <TaskDetailDialog
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          isAdmin={isAdmin}
          isUpdating={updatingTaskId === selectedTask?.id}
          onStatusChange={handleStatusChange}
          onEdit={(t) => {
            setEditingTask(t);
            setIsModalOpen(true);
          }}
          onDelete={(t) => setDeleteTarget(t)}
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
              ? `Remove "${deleteTarget.title}" (${deleteTarget.track_id}) permanently?`
              : ""
          }
          isBusy={isDeleting}
        />
      </div>
    </ProtectedRoute>
  );
}
