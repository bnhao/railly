"use client";
import React, {
  FormEvent,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { Plus, Search, Edit2, Trash2, Users } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppDialog, ConfirmDialog } from "@/components/ui/AppDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { Task } from "@/types/task";
import {
  fetchTasksCached,
  fetchUsersCached,
  getCachedTasks,
  getCachedUsers,
  invalidateUsersCache,
} from "@/utils/apiCache";

const AIchatbot = dynamic(() => import("@/components/AIchatbot"), {
  ssr: false,
  loading: () => null,
});

interface CrewUser {
  id: number;
  name: string;
  email: string;
  role?: string;
  roles?: string[];
}

const ALLOWED_ROLES = ["admin"];

export default function ManageUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<CrewUser[]>(
    () => (getCachedUsers<CrewUser>() ?? []) as CrewUser[]
  );
  const [tasks, setTasks] = useState<Task[]>(() => getCachedTasks<Task>() ?? []);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [loading, setLoading] = useState<boolean>(() => !getCachedUsers());

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CrewUser | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState("user");
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<CrewUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const reloadUsers = useCallback(async (force = false) => {
    const [fetchedUsers, fetchedTasks] = await Promise.all([
      fetchUsersCached<CrewUser>(force),
      fetchTasksCached<Task>(force),
    ]);
    setUsers(fetchedUsers);
    setTasks(fetchedTasks);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reloadUsers(false);
  }, [reloadUsers]);

  const workloadByUserId = useMemo(() => {
    const map = new Map<
      number,
      { pending: number; inProgress: number; completed: number }
    >();
    for (const t of tasks) {
      if (!t.assigned_to) continue;
      const uid = Number(t.assigned_to);
      const curr = map.get(uid) || { pending: 0, inProgress: 0, completed: 0 };
      const s = t.status?.toLowerCase();
      if (s === "completed") curr.completed++;
      else if (s === "in progress") curr.inProgress++;
      else curr.pending++;
      map.set(uid, curr);
    }
    return map;
  }, [tasks]);

  const filteredUsers = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        (u.role || u.roles?.[0] || "").toLowerCase().includes(q)
    );
  }, [users, deferredSearch]);

  const openAddDialog = () => {
    setEditingUser(null);
    setNameInput("");
    setEmailInput("");
    setRoleInput("user");
    setIsFormOpen(true);
  };

  const openEditDialog = (u: CrewUser) => {
    setEditingUser(u);
    setNameInput(u.name || "");
    setEmailInput(u.email || "");
    setRoleInput(u.role ?? u.roles?.[0] ?? "user");
    setIsFormOpen(true);
  };

  const handleSaveUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim()) return;
    setIsSaving(true);

    try {
      if (editingUser) {
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameInput.trim(),
            email: emailInput.trim(),
            role: roleInput,
          }),
        });
        if (!res.ok) throw new Error("Failed to update user");
        toast.success(`Updated crew member ${nameInput.trim()}.`);
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameInput.trim(),
            email: emailInput.trim(),
            role: roleInput,
          }),
        });
        if (!res.ok) throw new Error("Failed to add user");
        toast.success(`Added ${nameInput.trim()} to crew roster.`);
      }

      invalidateUsersCache();
      await reloadUsers(true);
      setIsFormOpen(false);
    } catch {
      toast.error("Failed to save crew member.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");

      invalidateUsersCache();
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success(`Removed ${deleteTarget.name} from roster.`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete user.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={ALLOWED_ROLES}>
      <div className="min-h-screen bg-[#0d1015] text-gray-200 px-4 py-4 lg:px-6 lg:py-5 space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-100 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-cyan-400" />
              Crew Roster & Access
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage supervisors and field operators with live task workload
              visibility.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddDialog}
            className="inline-flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Crew Member
          </button>
        </header>

        <div className="rounded-xl bg-[#151921] border border-[#242a36] p-3.5 flex items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="search"
              aria-label="Search crew by name, email, or role"
              placeholder="Search name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-[#0d1015] border border-[#242a36] pl-9 pr-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <span className="text-xs font-mono text-gray-400 ml-auto">
            {filteredUsers.length} members
          </span>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-label="Crew directory and workload"
          className="table-wrapper rounded-xl border border-[#242a36] bg-[#151921]"
        >
          <table className="responsive-data-table text-left text-xs text-gray-300">
            <thead className="bg-[#10141c] text-[11px] uppercase text-gray-400">
              <tr>
                <th className="px-4 py-3.5 font-semibold border-b border-[#242a36]">
                  ID
                </th>
                <th className="px-4 py-3.5 font-semibold border-b border-[#242a36]">
                  Name
                </th>
                <th className="px-4 py-3.5 font-semibold border-b border-[#242a36]">
                  Email
                </th>
                <th className="px-4 py-3.5 font-semibold border-b border-[#242a36]">
                  Role
                </th>
                <th className="px-4 py-3.5 font-semibold border-b border-[#242a36]">
                  Assigned Workload
                </th>
                <th className="px-4 py-3.5 font-semibold border-b border-[#242a36] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242a36]/60">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-5 rounded bg-[#0d1015]" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No crew members found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const userRole = u.role || u.roles?.[0] || "user";
                  const load = workloadByUserId.get(u.id) || {
                    pending: 0,
                    inProgress: 0,
                    completed: 0,
                  };
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[#1b202b] transition-colors"
                    >
                      <td
                        data-label="ID"
                        className="px-4 py-3 font-mono tabular-nums text-gray-400"
                      >
                        #{u.id}
                      </td>
                      <td
                        data-label="Name"
                        className="px-4 py-3 font-semibold text-gray-100"
                      >
                        {u.name}
                      </td>
                      <td
                        data-label="Email"
                        className="px-4 py-3 text-gray-300 font-mono text-[11px]"
                      >
                        {u.email}
                      </td>
                      <td data-label="Role" className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-mono uppercase font-semibold border ${
                            userRole === "admin"
                              ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
                              : "bg-gray-700/30 text-gray-300 border-gray-600/40"
                          }`}
                        >
                          {userRole === "admin" ? "Supervisor" : "Field Crew"}
                        </span>
                      </td>
                      <td data-label="Workload" className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5 font-mono text-[11px] tabular-nums">
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            {load.pending} pending
                          </span>
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                            {load.inProgress} active
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            {load.completed} done
                          </span>
                        </div>
                      </td>
                      <td data-label="Actions" className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditDialog(u)}
                            aria-label={`Edit ${u.name}`}
                            className="p-1.5 rounded-md text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(u)}
                            aria-label={`Remove ${u.name}`}
                            className="p-1.5 rounded-md text-gray-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AppDialog
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingUser ? `Edit Crew: ${editingUser.name}` : "Add Crew Member"}
          allowLightDismiss={!isSaving}
          maxWidthClass="max-w-md"
        >
          <form onSubmit={handleSaveUser} className="space-y-4">
            <div>
              <label
                htmlFor="crew-name"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
              >
                Full Name *
              </label>
              <input
                id="crew-name"
                type="text"
                required
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full rounded-lg bg-[#0d1015] border border-[#242a36] px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label
                htmlFor="crew-email"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
              >
                Email Address *
              </label>
              <input
                id="crew-email"
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full rounded-lg bg-[#0d1015] border border-[#242a36] px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label
                htmlFor="crew-role"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
              >
                Operational Role
              </label>
              <select
                id="crew-role"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                className="w-full rounded-lg bg-[#0d1015] border border-[#242a36] px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="user">Field Crew (user)</option>
                <option value="admin">Supervisor (admin)</option>
              </select>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1e2430] text-gray-200 hover:bg-[#272f3f] border border-[#2d3546]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : editingUser ? "Save Changes" : "Add Crew"}
              </button>
            </div>
          </form>
        </AppDialog>

        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title={deleteTarget ? `Remove ${deleteTarget.name}?` : "Remove User?"}
          message={
            deleteTarget
              ? `Remove "${deleteTarget.name}" (${deleteTarget.email}) from the crew directory?`
              : ""
          }
          isBusy={isDeleting}
        />
      </div>
      <AIchatbot />
    </ProtectedRoute>
  );
}
