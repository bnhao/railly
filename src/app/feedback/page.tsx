"use client";
import { useAuth } from "@/app/context/AuthContext";
import AdminFeedbackClient from "@/components/feedback/AdminFeedbackClient";
import UserFeedbackClient from "@/components/feedback/UserFeedbackClient";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function FeedbackPage() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (role === "admin") {
    return <AdminFeedbackClient />;
  }

  if (role === "user") {
    return <UserFeedbackClient />;
  }

  return null;
}
