"use client";
import { useUserSession } from "@/hooks/useUserSession";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Home() {
  useUserSession();

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-[#121418] gap-4">
      <LoadingSpinner />
      <p className="text-sm font-mono text-gray-400">
        Initializing Railly Operations...
      </p>
    </div>
  );
}
