"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function FeedbackRedirect() {
  const { role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (role === "admin") {
        router.replace("/dashboard/admin");
      } else if (role === "user") {
        router.replace("/dashboard/user");
      } else {
        router.replace("/unauthorized");
      }
    }
  }, [role, isLoading, router]);

  return <p>Redirecting to your dashboard page...</p>;
}
