import LoadingSpinner from "@/components/LoadingSpinner";

export default function AdminDashboardLoading() {
  return (
    <div className="flex items-center justify-center w-full h-screen">
      <LoadingSpinner />
    </div>
  );
}
