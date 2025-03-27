// app/admin/page.tsx
import Nav from "@/components/navbar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminPage() {
  return (
    <div className="flex">
      <ProtectedRoute allowedRoles={["admin"]}>
        <div className="flex items-center justify-center h-screen w-full">
          <h1 className="text-2xl font-bold">Welcome to the Admin Dashboard</h1>
        </div>
      </ProtectedRoute>
    </div>
  );
}