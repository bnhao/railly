"use client";
import React, { useEffect, useState } from "react";
import { FeedbackData } from "@/app/types/feedback";

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
    <div className="bg-[#1e1e1e] p-4 rounded-lg shadow-md w-full max-w-lg">
      <h2 className="text-lg font-bold text-white mb-2">
        {initialData ? "Edit Feedback" : "Add Feedback"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white mb-1">Name</label>
          <input
            type="text"
            className="w-full p-2 bg-[#393A3E] text-white rounded-md border-none"
            value={created_by}
            onChange={(e) => setCreatedBy(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-white mb-1">
            What do you like about the application?
          </label>
          <textarea
            className="w-full p-2 bg-[#393A3E] text-white rounded-md border-none"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-white mb-1">How can we improve?</label>
          <textarea
            className="w-full p-2 bg-[#393A3E] text-white rounded-md border-none"
            rows={3}
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            required
          />
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            {initialData ? "Update" : "Submit"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded-md"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
