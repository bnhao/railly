import { Suspense } from "react";
import UserDashboardClient from "@/components/dashboard/UserDashboardClient";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function UserDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-full h-screen">
          <LoadingSpinner />
        </div>
      }
    >
      <UserDashboardClient />
    </Suspense>
  );
}
