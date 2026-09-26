"use client";
import { useUserSession } from "@/hooks/useUserSession";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Home() {
  const { loading } = useUserSession();

  if (loading) {
    return <p>Loading...</p>;
  }

  return <LoadingSpinner />;
}
