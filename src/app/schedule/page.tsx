import { Suspense } from "react";
import ScheduleClient from "@/components/schedule/ScheduleClient";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-full h-screen bg-[#121418]">
          <LoadingSpinner />
        </div>
      }
    >
      <ScheduleClient />
    </Suspense>
  );
}
