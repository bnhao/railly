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

      toast.info("Redirecting to your dashboard page...", {
        position: "top-center",
        autoClose: 300,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
      });

      switch (role) {
        case "admin":
          router.replace("/dashboard/admin");
          break;
        case "user":
          router.replace("/dashboard/user");
          break;
        default:
          toast.error("You don't have permission to access this page.");
          router.replace("/unauthorized");
          break;
      }
    }
  }, [role, isLoading, router]);

  return <p>Redirecting to your dashboard page...</p>;
}
