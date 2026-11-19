"use client";
import React, { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/ProtectedRoute";
import SelectLocation from "@/components/weather/SelectLocation";

const AIchatbot = dynamic(() => import("@/components/AIchatbot"), {
  ssr: false,
  loading: () => null,
});

const ALLOWED_ROLES = ["admin", "user"];

export default function WeatherPage() {
  const [selectedId, setSelectedId] = useState("");

  const handleSelectId = useCallback((id: string) => {
    setSelectedId(String(id).trim());
  }, []);

  return (
    <ProtectedRoute allowedRoles={ALLOWED_ROLES}>
      <div className="min-h-screen bg-[#0d1015] text-gray-200 px-4 py-4 lg:px-6 lg:py-5">
        <SelectLocation
          selectedId={selectedId}
          onSelectCorridor={handleSelectId}
        />
      </div>
      <AIchatbot />
    </ProtectedRoute>
  );
}
