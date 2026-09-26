import LoadingSpinner from "@/components/LoadingSpinner";

export default function UserDashboardLoading() {
  return (
    <div className="flex items-center justify-center w-full h-screen">
      <LoadingSpinner />
    </div>
  );
}
