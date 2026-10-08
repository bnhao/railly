import { Suspense } from "react";
import DashboardClient from "@/components/dashboard/DashboardClient";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-full h-screen">
          <LoadingSpinner />
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
