"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PlusCircle } from "lucide-react";
import FeedbackTable from "@/components/feedback/FeedbackTable";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import { ConfirmDialog } from "@/components/ui/AppDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { FeedbackData } from "@/types/feedback";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/app/context/AuthContext";
import {
  fetchFeedbackCached,
  getCachedFeedback,
  invalidateFeedbackCache,
} from "@/utils/apiCache";

const ALLOWED_ROLES = ["admin"];

export default function AdminFeedbackClient() {
  const { user } = useAuth();
  const toast = useToast();
  const [feedbackList, setFeedbackList] = useState<FeedbackData[]>(
    () => getCachedFeedback() ?? []
  );
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackData | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FeedbackData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sort, setSort] = useState("date");

  const loadFeedback = useCallback(async (force = false) => {
    const data = await fetchFeedbackCached(force);
    setFeedbackList(data);
  }, []);

  useEffect(() => {
    void loadFeedback(false);
  }, [loadFeedback]);

  const handleSaveFeedback = async (feedback: {
    feedback_id?: number;
    created_by: string;
    description: string;
    suggestion: string;
  }) => {
    try {
      if (selectedFeedback) {
        const res = await fetch(
          `/api/feedback/${selectedFeedback.feedback_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(feedback),
          }
        );
        if (!res.ok) throw new Error("Failed update");
        toast.success("Updated feedback report.");
      } else {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(feedback),
        });
        if (!res.ok) throw new Error("Failed create");
        toast.success("Submitted field report.");
      }

      invalidateFeedbackCache();
      await loadFeedback(true);
      setShowForm(false);
      setSelectedFeedback(null);
    } catch {
      toast.error("Could not save feedback.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/feedback/${deleteTarget.feedback_id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      invalidateFeedbackCache();
      setFeedbackList((prev) =>
        prev.filter((f) => f.feedback_id !== deleteTarget.feedback_id)
      );
      toast.success("Feedback report deleted.");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete feedback.");
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
      } else if (sort === "relevance") {
        return b.description.length - a.description.length;
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
              Field Feedback & Reports
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Review crew observations and operational improvement proposals.
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
            Add Feedback
          </button>
        </header>

        <div className="flex items-center justify-between gap-3">
          <select
            aria-label="Sort feedback entries"
            className="rounded-lg bg-[#151921] text-gray-200 px-3 py-2 text-xs border border-[#242a36] focus:outline-none focus:border-cyan-500"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="date">Sort by Latest Date</option>
            <option value="actor">Sort by Reporter</option>
            <option value="relevance">Sort by Detail Length</option>
          </select>
          <span className="text-xs font-mono text-gray-500">
            {sortedFeedbackList.length} reports
          </span>
        </div>

        <FeedbackTable
          feedbackList={sortedFeedbackList}
          onEdit={(fb) => {
            setSelectedFeedback(fb);
            setShowForm(true);
          }}
          onDelete={(fb) => setDeleteTarget(fb)}
        />

        <FeedbackForm
          isOpen={showForm}
          initialData={selectedFeedback}
          defaultAuthor={user?.email || ""}
          onSubmit={handleSaveFeedback}
          onCancel={() => {
            setShowForm(false);
            setSelectedFeedback(null);
          }}
        />

        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Feedback Report?"
          message={
            deleteTarget
              ? `Remove feedback submitted by "${deleteTarget.created_by}"?`
              : ""
          }
          isBusy={isDeleting}
        />
      </div>
    </ProtectedRoute>
  );
}
