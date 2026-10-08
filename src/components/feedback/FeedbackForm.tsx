"use client";
import React, { useEffect, useState } from "react";
import { FeedbackData } from "@/types/feedback";

interface FeedbackFormProps {
  initialData?: FeedbackData | null;
  onSubmit: (data: {
    feedback_id?: number;
    created_by: string;
    description: string;
    suggestion: string;
  }) => void;
  onCancel: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [created_by, setCreatedBy] = useState(initialData?.created_by || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [suggestion, setSuggestion] = useState(initialData?.suggestion || "");

  useEffect(() => {
    if (initialData) {
      setCreatedBy(initialData.created_by);
      setDescription(initialData.description);
      setSuggestion(initialData.suggestion);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!created_by || !description || !suggestion) return;

    onSubmit({
      feedback_id: initialData?.feedback_id,
      created_by,
      description,
      suggestion,
    });

    setCreatedBy("");
    setDescription("");
    setSuggestion("");
  };

  return (
    <div className="bg-[#1e2128] border border-gray-800/50 p-8 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-lg">
      <h2 className="font-bold text-2xl text-cyan-400 tracking-wide drop-shadow-[0_0_8px_rgba(6,182,212,0.4)] mb-6">
        {initialData ? "Edit Feedback" : "Add Feedback"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
          <input
            type="text"
            className="w-full p-3 bg-[#181a20] text-gray-200 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors"
            value={created_by}
            onChange={(e) => setCreatedBy(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            What do you like about the application?
          </label>
          <textarea
            className="w-full p-3 bg-[#181a20] text-gray-200 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">How can we improve?</label>
          <textarea
            className="w-full p-3 bg-[#181a20] text-gray-200 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors"
            rows={3}
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end mt-8">
          <button
            type="submit"
            className="bg-cyan-600 px-6 py-2.5 rounded-xl font-semibold text-sm text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-500/20"
          >
            {initialData ? "Update" : "Submit"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-800 px-6 py-2.5 rounded-xl font-semibold text-sm text-gray-300 hover:bg-gray-700 hover:text-gray-100 transition-colors ml-3"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
