"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";

export default function FeedbackRedirect() {
  const { role, isLoading } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isLoading && !hasRedirected.current) {
      hasRedirected.current = true;

      toast.info("Redirecting based on your role...", {
        position: "top-center",
        autoClose: 500,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
      });

      if (role === "admin") {
        router.replace("/schedule/admin");
      } else if (role === "user") {
        router.replace("/schedule/user");
      } else {
        router.replace("/unauthorized");
      }
    }
  }, [role, isLoading, router]);

  return <p>Redirecting to your task scheduling page...</p>;
}
