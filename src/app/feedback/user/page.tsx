"use client";
import React, { useEffect, useState } from "react";
import Nav from "@/components/navbar";
import { FeedbackData } from "@/app/types/feedback";
import { useAuth } from "@/app/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import FeedbackForm from "@/components/feedback/FeedbackForm"; // make sure this is imported
import { PlusCircle } from "lucide-react"; // import if you want the icon

type LocalFeedback = FeedbackData & { likes: number; comments: string[] };

export default function UserFeedbackPage() {
  const { user, isLoading } = useAuth();
  const [feedbackList, setFeedbackList] = useState<LocalFeedback[]>([]);
  const [commentBoxOpen, setCommentBoxOpen] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [sort, setSort] = useState("date");
  const [showForm, setShowForm] = useState(false);

  const fetchFeedback = async () => {
    const res = await fetch("/api/feedback");
    const data: FeedbackData[] = await res.json();
    const enriched = data.map((item) => ({
      ...item,
      likes: 0,
      comments: [],
    }));
    setFeedbackList(enriched);
  };

  useEffect(() => {
    if (!isLoading) {
      fetchFeedback();
    }
  }, [isLoading]);

  const handleLike = (id: number) => {
    setFeedbackList((prev) =>
      prev.map((f) => (f.feedback_id === id ? { ...f, likes: f.likes + 1 } : f))
    );
  };

  const handleDislike = (id: number) => {
    setFeedbackList((prev) =>
      prev.map((f) =>
        f.feedback_id === id && f.likes > 0 ? { ...f, likes: f.likes - 1 } : f
      )
    );
  };

  const handleComment = (id: number) => {
    setFeedbackList((prev) =>
      prev.map((f) =>
        f.feedback_id === id
          ? { ...f, comments: [...f.comments, newComment] }
          : f
      )
    );
    setNewComment("");
    setCommentBoxOpen(null);
  };

  const sortedFeedbackList = [...feedbackList].sort((a, b) => {
    if (sort === "date") {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sort === "actor") {
      return a.created_by.localeCompare(b.created_by);
    } else if (sort === "relevance") {
      return b.likes - a.likes;
    }
    return 0;
  });

  const isUserPost = (feedback: FeedbackData) => {
    return user?.email === feedback.created_by;
  };

  return (
    <ProtectedRoute allowedRoles={["user", "admin"]}>
      <div className="flex">
        <Nav />
        <div className="px-6 bg-[#1e1e1e] text-white w-full min-h-screen">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Community Feedback</h1>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white p-3 rounded-md shadow-md flex items-center justify-center hover:bg-blue-700"
            >
              <PlusCircle size={20} className="mr-2" /> Add Feedback
            </button>
          </div>

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

          <div className="space-y-4">
            {sortedFeedbackList.map((feedback) => (
              <div
                key={feedback.feedback_id}
                className="border border-gray-700 rounded-lg p-4 bg-[#2e2e2e]"
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-lg font-semibold">
                      {feedback.created_by}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(feedback.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm">👍 {feedback.likes}</p>
                </div>
                <p className="mb-2">
                  <strong>What do you like?</strong> {feedback.description}
                </p>
                <p className="mb-2">
                  <strong>Suggestions:</strong> {feedback.suggestion}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleLike(feedback.feedback_id)}
                    className="bg-green-600 px-3 py-1 rounded"
                  >
                    Like
                  </button>
                  <button
                    onClick={() => handleDislike(feedback.feedback_id)}
                    className="bg-red-600 px-3 py-1 rounded"
                  >
                    Dislike
                  </button>
                  <button
                    onClick={() =>
                      setCommentBoxOpen(
                        commentBoxOpen === feedback.feedback_id
                          ? null
                          : feedback.feedback_id
                      )
                    }
                    className="bg-blue-600 px-3 py-1 rounded"
                  >
                    Comment
                  </button>
                  {isUserPost(feedback) && (
                    <button
                      onClick={() => alert("Edit modal coming soon.")}
                      className="bg-yellow-600 px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {commentBoxOpen === feedback.feedback_id && (
                  <div className="mt-2">
                    <textarea
                      className="w-full p-2 bg-[#393A3E] text-white rounded-md"
                      placeholder="Write a comment (not saved to database)..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button
                      className="mt-1 bg-blue-500 px-3 py-1 rounded"
                      onClick={() => handleComment(feedback.feedback_id)}
                    >
                      Post
                    </button>
                  </div>
                )}

                {feedback.comments.length > 0 && (
                  <div className="mt-2 text-sm text-gray-300">
                    <p className="font-semibold">Comments:</p>
                    <ul className="list-disc ml-5">
                      {feedback.comments.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Global Feedback Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <FeedbackForm
            initialData={null}
            onSubmit={async (feedback) => {
              await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...feedback,
                  created_by: user?.email || "anonymous",
                }),
              });
              setShowForm(false);
              fetchFeedback();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </ProtectedRoute>
  );
}
