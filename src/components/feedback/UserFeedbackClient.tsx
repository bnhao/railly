"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PlusCircle, Edit2, Trash2 } from "lucide-react";
import { FeedbackData } from "@/types/feedback";
import { useAuth } from "@/app/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import { ConfirmDialog } from "@/components/ui/AppDialog";
import { useToast } from "@/components/ui/ToastProvider";
import {
  fetchFeedbackCached,
  getCachedFeedback,
  invalidateFeedbackCache,
} from "@/utils/apiCache";

const ALLOWED_ROLES = ["user", "admin"];

export default function UserFeedbackClient() {
  const { user, isLoading } = useAuth();
  const toast = useToast();

  const [feedbackList, setFeedbackList] = useState<FeedbackData[]>(
    () => getCachedFeedback() ?? []
  );
  const [sort, setSort] = useState("date");
  const [showForm, setShowForm] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackData | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<FeedbackData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadFeedback = useCallback(async (force = false) => {
    const data = await fetchFeedbackCached(force);
    setFeedbackList(data);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      void loadFeedback(false);
    }
  }, [isLoading, loadFeedback]);

  const handleSave = async (feedback: {
    feedback_id?: number;
    created_by: string;
    description: string;
    suggestion: string;
  }) => {
    try {
      const isEdit = Boolean(selectedFeedback);
      const res = await fetch(
        isEdit
          ? `/api/feedback/${selectedFeedback?.feedback_id}`
          : "/api/feedback",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...feedback,
            created_by: feedback.created_by || user?.email || "Crew Operator",
          }),
        }
      );
      if (!res.ok) throw new Error("Failed");

      invalidateFeedbackCache();
      await loadFeedback(true);
      setShowForm(false);
      setSelectedFeedback(null);
      toast.success(isEdit ? "Report updated." : "Field feedback submitted.");
    } catch {
      toast.error("Failed to submit feedback.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/feedback/${deleteTarget.feedback_id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      invalidateFeedbackCache();
      setFeedbackList((prev) =>
        prev.filter((f) => f.feedback_id !== deleteTarget.feedback_id)
      );
      toast.success("Report deleted.");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete report.");
    } finally {
      setIsDeleting(false);
    }
  };

  const sortedFeedbackList = useMemo(() => {
    return [...feedbackList].sort((a, b) => {
      if (sort === "date") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else if (sort === "actor") {
        return a.created_by.localeCompare(b.created_by);
      }
      return 0;
    });
  }, [feedbackList, sort]);

  return (
    <ProtectedRoute allowedRoles={ALLOWED_ROLES}>
      <div className="min-h-screen bg-[#0d1015] text-gray-200 px-4 py-4 lg:px-6 lg:py-5 space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-100 tracking-tight">
              Crew Operational Feedback
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Report field blockers, track observations, or equipment requests.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedFeedback(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 rounded-lg text-xs font-semibold text-white transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Submit Report
          </button>
        </header>

        <div className="flex items-center justify-between gap-3">
          <select
            aria-label="Sort feedback"
            className="rounded-lg bg-[#151921] text-gray-200 px-3 py-2 text-xs border border-[#242a36] focus:outline-none focus:border-cyan-500"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="date">Newest First</option>
            <option value="actor">By Reporter</option>
          </select>
          <span className="text-xs font-mono text-gray-500">
            {sortedFeedbackList.length} reports
          </span>
        </div>

        <div className="space-y-3">
          {sortedFeedbackList.length === 0 ? (
            <div className="rounded-xl bg-[#151921] border border-[#242a36] p-8 text-center text-xs text-gray-500">
              No operational feedback reports yet.
            </div>
          ) : (
            sortedFeedbackList.map((feedback, idx) => {
              const isOwn = user?.email === feedback.created_by;
              return (
                <article
                  key={feedback.feedback_id}
                  className={`rounded-xl bg-[#151921] border border-[#242a36] p-4 space-y-2 ${
                    idx >= 5 ? "deferred-card" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-semibold text-cyan-300">
                        {feedback.created_by}
                      </h2>
                      <p className="text-[11px] font-mono text-gray-500">
                        {new Date(feedback.created_at).toLocaleString()}
                      </p>
                    </div>

                    {isOwn && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFeedback(feedback);
                            setShowForm(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[#0d1015] border border-[#242a36] text-gray-300 hover:text-cyan-300"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(feedback)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[#0d1015] border border-[#242a36] text-gray-300 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-200 leading-relaxed">
                    <strong className="text-gray-400">Observation: </strong>
                    {feedback.description}
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    <strong className="text-gray-400">Suggested Action: </strong>
                    {feedback.suggestion}
                  </p>
                </article>
              );
            })
          )}
        </div>

        <FeedbackForm
          isOpen={showForm}
          initialData={selectedFeedback}
          defaultAuthor={user?.email || ""}
          onSubmit={handleSave}
          onCancel={() => {
            setShowForm(false);
            setSelectedFeedback(null);
          }}
        />

        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Your Report?"
          message="This will permanently remove your submitted field report."
          isBusy={isDeleting}
        />
      </div>
    </ProtectedRoute>
  );
}
