"use client";
import React, { useEffect, useRef, useState } from "react";
import "chart.js/auto";
import Link from "next/link";
import { Trash2, Edit2 } from "lucide-react";
import dynamic from "next/dynamic";
import { CHART_OPTIONS } from "@/data/chartConfig";
import { trackCapacityData } from "@/data/trackData";
import WeatherWidget from "@/components/weather/WeatherWidget";
import { toast, Toaster } from "react-hot-toast";
import { useAuth } from "@/app/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Task } from "@/types/task";
import LoadingSpinner from "@/components/LoadingSpinner";

// Lazy load heavy components
const RailwayMap = dynamic(() => import("@/components/railwayMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#1e2128] shadow-lg shadow-black/20 rounded-xl rounded-md">
      <LoadingSpinner />
    </div>
  ),
});

const AIchatbot = dynamic(() => import("@/components/AIchatbot"), {
  ssr: false,
  loading: () => null,
});

const TrackCapacityChart = dynamic(
  () => import("@/components/trackOverViewComponents/TrackCapacityChart"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    ),
  }
);

export default function UserDashboardClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [hoveredContainer, setHoveredContainer] = useState<string | null>(null);

  const descriptions: Record<string, string> = {
    weather: "View the latest weather updates for railway operations.",
    capacity: "Track capacity overview and congestion levels.",
    schedules: "Manage and view the railway schedules and priorities.",
  };

  const { role } = useAuth();

  // Fetch tasks from the API
  const getTasks = async (): Promise<Task[]> => {
    try {
      const response = await fetch("/api/tasks");
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Invalid tasks data format");
      }

      return data;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }
  };

  // Fetch tasks on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      const tasks = await getTasks();
      setTasks(tasks);
    };
    fetchTasks();
  }, []);

  const hasShownToast = useRef(false);
  useEffect(() => {
    if (!role || hasShownToast.current) return;
    hasShownToast.current = true;
    toast.success(
      <span>
        You are logged in as <strong>{role}</strong>
      </span>,
      {
        duration: 4000,
        position: "top-center",
        style: {
          background: "#333",
          color: "#fff",
        },
      }
    );
  }, [role]);

  return (
    <ProtectedRoute allowedRoles={["admin", "user"]}>
      <Toaster />
      <div className="flex">
        <div className="px-6 py-6 bg-[#121418] text-gray-200 w-full min-h-screen flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 gap-6 h-full">
            <div
              className="lg:col-span-1 lg:row-span-1 flex flex-col h-full min-h-[300px] bg-[#1e2128] shadow-lg shadow-black/20 rounded-xl flex-grow hover:cursor-pointer overflow-hidden"
              
            >
              <WeatherWidget />
              {hoveredContainer === "weather" && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-black text-white text-md px-2 py-1 rounded shadow-md z-10">
                  {descriptions.weather}
                </div>
              )}
            </div>
            <div
              className="lg:col-span-1 lg:row-span-1 flex flex-col space-y-4 h-full min-h-[300px] p-6 bg-[#1e2128] shadow-lg shadow-black/20 rounded-xl flex-grow hover:cursor-pointer overflow-hidden"
              
            >
              <TrackCapacityChart
                data={trackCapacityData}
                options={CHART_OPTIONS}
              />
              {hoveredContainer === "capacity" && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-black text-white text-md px-2 py-1 rounded shadow-md z-10">
                  {descriptions.capacity}
                </div>
              )}
            </div>
            <div
              className="lg:col-span-1 lg:row-span-1 flex flex-col space-y-4 h-full min-h-[300px] rounded-xl p-6 bg-[#1e2128] shadow-lg shadow-black/20 flex-grow hover:cursor-pointer overflow-hidden"
              
            >
              <div className="flex items-center justify-between mb-2"><h3 className="text-lg font-semibold text-gray-100">Active Schedules</h3></div>{" "}
              <div className="w-full overflow-hidden rounded-lg border border-gray-800/50">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-[#181a20] text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Order #</th>
                      <th className="px-6 py-4 font-medium">Track</th>
                      <th className="px-6 py-4 font-medium">Priority</th>
                      <th className="px-6 py-4 font-medium">Assigned To</th>
                      <th className="px-6 py-4 font-medium">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50 bg-[#1e2128]">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-300">{task.id}</td>
                        <td className="px-6 py-4 font-mono text-cyan-400">#{task.track_id}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            task.priority.toLowerCase() === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            task.priority.toLowerCase() === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{task.assigned_to}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            task.status.toLowerCase() === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            task.status.toLowerCase() === 'in progress' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hoveredContainer === "schedules" && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-black text-white text-md px-2 py-1 rounded shadow-md z-10">
                  {descriptions.schedules}
                </div>
              )}
            </div>
            <RailwayMap onFeatureSelect={setSelectedFeature} />
          </div>
        </div>
        <AIchatbot />
      </div>
    </ProtectedRoute>
  );
}
