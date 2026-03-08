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
        router.replace("/feedback/admin");
      } else if (role === "user") {
        router.replace("/feedback/user");
      } else {
        router.replace("/unauthorized");
      }
    }
  }, [role, isLoading, router]);
 
  return <p>Redirecting to your feedback page...</p>;
}