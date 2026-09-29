"use client";
import React, { useEffect, useState } from "react";
import FeedbackTable from "@/components/feedback/FeedbackTable";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import { PlusCircle } from "lucide-react";
import Nav from "@/components/navbar";
import { FeedbackData } from "@/app/types/feedback";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<FeedbackData[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackData | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [sort, setSort] = useState("date");

  // Fetch feedback from database
  const fetchFeedback = async () => {
    const res = await fetch("/api/feedback");
    const data = await res.json();
    setFeedbackList(data);
  };

  useEffect(() => {
    fetchFeedback();

    // Set up polling every 5 seconds
    const interval = setInterval(() => {
      fetchFeedback();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAddFeedback = async (feedback: {
    feedback_id?: number;
    created_by: string;
    description: string;
    suggestion: string;
  }) => {
    if (selectedFeedback) {
      // This is an edit → use PUT
      await fetch(`/api/feedback/${selectedFeedback.feedback_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedback),
      });
    } else {
      // This is a new feedback → use POST
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedback),
      });
    }

    fetchFeedback();
    setShowForm(false);
    setSelectedFeedback(null); // Clear after update
  };

  const handleEditFeedback = (feedback: FeedbackData) => {
    setSelectedFeedback(feedback);
    setShowForm(true);
  };

  const handleDeleteFeedback = async (id: number) => {
    await fetch(`/api/feedback/${id}`, {
      method: "DELETE",
    });
    fetchFeedback();
  };

  const sortedFeedbackList = [...feedbackList].sort((a, b) => {
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

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="flex">
        <div className="px-6 bg-[#1e1e1e] text-white w-full min-h-screen">
          <div className="flex justify-between items-center mb-4">
            <h1 className="font-bold text-3xl text-cyan-400 tracking-wide drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">User Feedback</h1>
            <button
              onClick={() => {
                setSelectedFeedback(null);
                setShowForm(true);
              }}
              className="bg-cyan-600 px-5 py-2.5 rounded-xl text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-500 transition-colors duration-200 flex items-center justify-center font-semibold text-sm"
            >
              <PlusCircle size={20} className="mr-2" /> Add Feedback
            </button>
          </div>

          <div className="mb-4">
            <select
              className="p-3 bg-[#181a20] text-gray-200 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors shadow-lg shadow-black/20"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="date">Sort by Date</option>
              <option value="actor">Sort by Actor</option>
              <option value="relevance">Sort by Most Relevant</option>
            </select>
          </div>

          <FeedbackTable
            feedbackList={sortedFeedbackList}
            onEdit={handleEditFeedback}
            onDelete={handleDeleteFeedback}
          />

          {showForm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
              <FeedbackForm
                initialData={selectedFeedback}
                onSubmit={handleAddFeedback}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
