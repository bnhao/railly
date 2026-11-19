"use client";
import React, { memo } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { FeedbackData } from "@/types/feedback";

interface FeedbackTableProps {
  feedbackList: FeedbackData[];
  onEdit: (feedback: FeedbackData) => void;
  onDelete: (feedback: FeedbackData) => void;
}

const FeedbackTable: React.FC<FeedbackTableProps> = ({
  feedbackList,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Submitted field feedback reports"
      className="table-wrapper rounded-xl border border-[#242a36] bg-[#151921]"
    >
      <table className="responsive-data-table text-left text-xs text-gray-300">
        <thead className="bg-[#10141c] text-[11px] uppercase text-gray-400">
          <tr>
            <th className="px-4 py-3.5 font-semibold border-b border-[#242a36]">
              Reporter
            </th>
            <th className="px-4 py-3.5 font-semibold border-b border-[#242a36]">
              Date
            </th>
            <th className="px-4 py-3.5 font-semibold border-b border-[#242a36]">
              Observation
            </th>
            <th className="px-4 py-3.5 font-semibold border-b border-[#242a36]">
              Suggestion
            </th>
            <th className="px-4 py-3.5 font-semibold border-b border-[#242a36] text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#242a36]/60">
          {feedbackList.length > 0 ? (
            feedbackList.map((feedback) => (
              <tr
                key={feedback.feedback_id}
                className="hover:bg-[#1b202b] transition-colors"
              >
                <td
                  data-label="Reporter"
                  className="px-4 py-3 font-medium text-cyan-300"
                >
                  {feedback.created_by}
                </td>
                <td
                  data-label="Date"
                  className="px-4 py-3 font-mono tabular-nums text-gray-400 whitespace-nowrap"
                >
                  {new Date(feedback.created_at).toLocaleDateString()}
                </td>
                <td
                  data-label="Observation"
                  className="px-4 py-3 text-gray-200 max-w-xs"
                >
                  {feedback.description}
                </td>
                <td
                  data-label="Suggestion"
                  className="px-4 py-3 text-gray-300 max-w-xs"
                >
                  {feedback.suggestion}
                </td>
                <td data-label="Actions" className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(feedback)}
                      aria-label={`Edit feedback #${feedback.feedback_id}`}
                      className="p-1.5 rounded-md text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(feedback)}
                      aria-label={`Delete feedback #${feedback.feedback_id}`}
                      className="p-1.5 rounded-md text-gray-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center px-4 py-8 text-gray-500">
                No feedback reports available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default memo(FeedbackTable);
