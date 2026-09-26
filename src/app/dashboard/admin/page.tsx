import { Suspense } from "react";
import AdminDashboardClient from "@/components/dashboard/AdminDashboardClient";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-full h-screen">
          <LoadingSpinner />
        </div>
      }
    >
      <AdminDashboardClient />
    </Suspense>
  );
}