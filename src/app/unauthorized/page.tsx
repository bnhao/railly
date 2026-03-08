"use client";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";

export default function UnauthorizedPage() {
    const { user, role, permissions } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
                <h1 className="text-2xl font-bold text-red-500 mb-4">Unauthorized</h1>
                <p className="text-white mb-6">
                    You do not have permission to view this page.
                </p>

                {/* Debug info */}
                <div className="bg-gray-700 p-4 rounded mb-6">
                    <h2 className="text-lg font-semibold text-yellow-400 mb-2">Debug Information</h2>
                    <p className="text-gray-300"><strong>Logged in:</strong> {user ? 'Yes' : 'No'}</p>
                    <p className="text-gray-300"><strong>Current role:</strong> {role || 'None'}</p>
                    <p className="text-gray-300"><strong>Required role:</strong> admin</p>

                </div>

                <div className="space-y-4">
                    <Link href="/" className="block w-full text-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                        Go to Home
                    </Link>
                </div>
            </div>
        </div >
    );
}