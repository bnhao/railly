"use client";
import dynamic from "next/dynamic";
import { useAuth } from "@/app/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

const AdminFeedbackClient = dynamic(
  () => import("@/components/feedback/AdminFeedbackClient"),
  {
    loading: () => (
      <div className="flex items-center justify-center w-full h-screen bg-[#121418]">
        <LoadingSpinner />
      </div>
    ),
  }
);

const UserFeedbackClient = dynamic(
  () => import("@/components/feedback/UserFeedbackClient"),
  {
    loading: () => (
      <div className="flex items-center justify-center w-full h-screen bg-[#121418]">
        <LoadingSpinner />
      </div>
    ),
  }
);

export default function FeedbackPage() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-[#121418]">
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
