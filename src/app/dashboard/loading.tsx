import LoadingSpinner from "@/components/LoadingSpinner";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center w-full h-screen bg-[#121418]">
      <LoadingSpinner />
    </div>
  );
}
