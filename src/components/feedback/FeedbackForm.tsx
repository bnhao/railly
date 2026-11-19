"use client";
import React, { useEffect, useState } from "react";
import { FeedbackData } from "@/types/feedback";
import { AppDialog } from "@/components/ui/AppDialog";

interface FeedbackFormProps {
  isOpen: boolean;
  initialData?: FeedbackData | null;
  defaultAuthor?: string;
  onSubmit: (data: {
    feedback_id?: number;
    created_by: string;
    description: string;
    suggestion: string;
  }) => Promise<void> | void;
  onCancel: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  isOpen,
  initialData,
  defaultAuthor = "",
  onSubmit,
  onCancel,
}) => {
  const [createdBy, setCreatedBy] = useState("");
  const [description, setDescription] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setCreatedBy(initialData.created_by || "");
      setDescription(initialData.description || "");
      setSuggestion(initialData.suggestion || "");
    } else {
      setCreatedBy(defaultAuthor);
      setDescription("");
      setSuggestion("");
    }
  }, [isOpen, initialData, defaultAuthor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdBy.trim() || !description.trim() || !suggestion.trim()) return;
    setIsSaving(true);
    try {
      await onSubmit({
        feedback_id: initialData?.feedback_id,
        created_by: createdBy.trim(),
        description: description.trim(),
        suggestion: suggestion.trim(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onCancel}
      title={initialData ? "Edit Field Report" : "Submit Field Feedback"}
      subtitle="Share operational observations, safety concerns, or platform improvements."
      allowLightDismiss={!isSaving}
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="fb-author"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
          >
            Operator Name / Email *
          </label>
          <input
            id="fb-author"
            type="text"
            required
            autoFocus={!defaultAuthor}
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            className="w-full rounded-lg bg-[#0d1015] border border-[#242a36] px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label
            htmlFor="fb-desc"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
          >
            Observation / Operational Note *
          </label>
          <textarea
            id="fb-desc"
            rows={3}
            required
            autoFocus={Boolean(defaultAuthor)}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg bg-[#0d1015] border border-[#242a36] px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label
            htmlFor="fb-suggestion"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
          >
            Recommended Action / Suggestion *
          </label>
          <textarea
            id="fb-suggestion"
            rows={3}
            required
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            className="w-full rounded-lg bg-[#0d1015] border border-[#242a36] px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="pt-3 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1e2430] text-gray-200 hover:bg-[#272f3f] border border-[#2d3546]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : initialData ? "Save Changes" : "Submit Report"}
          </button>
        </div>
      </form>
    </AppDialog>
  );
};

export default FeedbackForm;
