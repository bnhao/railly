"use client";
import React, { useState } from "react";
import FeedbackTable from "@/components/feedback/FeedbackTable";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import { FeedbackData, initialFeedbackData } from "@/data/feedbackData";
import { PlusCircle } from "lucide-react";
import Nav from "@/components/navbar";
import AIchatbot from "@/components/AIchatbot";

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] =
    useState<FeedbackData[]>(initialFeedbackData);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackData | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [sort, setSort] = useState("date");

  const handleAddFeedback = (feedback: FeedbackData) => {
    setFeedbackList((prev) =>
      prev.some((f) => f.id === feedback.id)
        ? prev.map((f) => (f.id === feedback.id ? feedback : f))
        : [
            ...prev,
            {
              ...feedback,
              likes: feedback.likes || "No response provided.",
              improvements: feedback.improvements || "No response provided.",
            },
          ]
    );
    setShowForm(false);
  };

  const handleEditFeedback = (feedback: FeedbackData) => {
    setSelectedFeedback(feedback);
    setShowForm(true);
  };

  const handleDeleteFeedback = (id: number) => {
    setFeedbackList((prev) => prev.filter((f) => f.id !== id));
  };

  // Sorting function
  const sortedFeedbackList = [...feedbackList].sort((a, b) => {
    if (sort === "date") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sort === "actor") {
      return a.name.localeCompare(b.name);
    } else if (sort === "relevance") {
      return b.likes.length - a.likes.length;
    }
    return 0;
  });

  return (
    <div className="flex">
      <Nav />
      <div className="px-6 bg-[#1e1e1e] text-white w-full min-h-screen">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">User Feedback</h1>
          {/* Add Feedback Button */}
          <button
            onClick={() => {
              setSelectedFeedback(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white p-3 rounded-md shadow-md flex items-center justify-center hover:bg-blue-700"
          >
            <PlusCircle size={20} className="mr-2" /> Add Feedback
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="mb-4">
          <select
            className="p-2 bg-[#393A3E] text-white rounded-md border-none"
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

        {/* Feedback Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
            <FeedbackForm
              initialData={selectedFeedback}
              onSubmit={handleAddFeedback}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}
      </div>
      <AIchatbot />
    </div>
  );
}
