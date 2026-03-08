"use client";
import React from "react";
import { FeedbackData } from "@/app/types/feedback";

interface FeedbackTableProps {
  feedbackList: FeedbackData[];
  onEdit: (feedback: FeedbackData) => void;
  onDelete: (id: number) => void;
}

const FeedbackTable: React.FC<FeedbackTableProps> = ({
  feedbackList,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-hidden rounded-md border bg-[#393A3E] p-4">
      <table className="w-full text-sm text-white">
        <thead>
          <tr className="bg-black text-white">
            <th className="p-2">Name</th>
            <th className="p-2">Date</th>
            <th className="p-2">What do you like about the application?</th>
            <th className="p-2">How can we improve?</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {feedbackList.length > 0 ? (
            feedbackList.map((feedback) => (
              <tr
                key={feedback.feedback_id}
                className="border-b border-gray-700"
              >
                <td className="p-2">{feedback.created_by}</td>
                <td className="p-2">
                  {new Date(feedback.created_at).toLocaleDateString()}
                </td>
                <td className="p-2">{feedback.description}</td>
                <td className="p-2">{feedback.suggestion}</td>
                <td className="p-2 flex flex-col gap-2">
                  <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                    onClick={() => onDelete(feedback.feedback_id)}
                  >
                    Delete
                  </button>
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                    onClick={() => onEdit(feedback)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center p-4 text-gray-400">
                No feedback available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FeedbackTable;
