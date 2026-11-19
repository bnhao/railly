"use client";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  const { user, role } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d1015] p-4">
      <div className="bg-[#151921] border border-[#242a36] p-8 rounded-2xl shadow-2xl max-w-md w-full space-y-5">
        <div className="flex items-center gap-3 text-rose-400">
          <ShieldAlert className="w-6 h-6" />
          <h1 className="text-xl font-bold">Access Restricted</h1>
        </div>
        <p className="text-sm text-gray-300">
          Your account role does not permit viewing this control panel.
        </p>

        <div className="bg-[#0d1015] border border-[#242a36] p-4 rounded-xl text-xs font-mono space-y-1">
          <p className="text-gray-300">
            <strong>Status:</strong> {user ? "Authenticated" : "Signed Out"}
          </p>
          <p className="text-gray-300">
            <strong>Current Role:</strong> {role || "None"}
          </p>
          <p className="text-gray-400">
            <strong>Required Role:</strong> Supervisor (admin)
          </p>
        </div>

        <Link
          href={user ? "/dashboard" : "/login"}
          className="block w-full text-center bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm py-2.5 px-4 rounded-xl transition-colors"
        >
          {user ? "Return to Dashboard" : "Go to Login"}
        </Link>
      </div>
    </div>
  );
}
