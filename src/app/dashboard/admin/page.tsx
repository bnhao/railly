"use client";
import React, { useEffect, useRef, useState } from "react";
import "chart.js/auto";
import Link from "next/link";
import TrackCapacityChart from "@/components/trackOverViewComponents/TrackCapacityChart";
import { CHART_OPTIONS } from "@/data/chartConfig";
import { trackCapacityData } from "@/data/trackData";
import AIchatbot from "@/components/AIchatbot";
import WeatherWidget from "@/components/weather/WeatherWidget";
import RailwayMap from "@/components/railwayMap";
import { toast, Toaster } from "react-hot-toast"
import { useAuth } from "@/app/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Dashboard() {
  type Task = {
    id: number;
    title: string;
    description: string;
    status: string;
    assigned_to: string;
    created_by: string;
    due_date: string;
    priority: string;
    date: string;
    track_id: number;
  };

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

  // Delete a task
  const handleDeleteTask = async (taskId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.statusText}`);
      }

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
      alert("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task");
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
    <ProtectedRoute allowedRoles={["admin"]}>
      <Toaster />
      <div className="flex">
        <div className="px-5 bg-background text-foreground w-full h-screen flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 gap-5 h-full">
            <div
              className="lg:col-span-1 lg:row-span-1 flex flex-col space-y-3 h-full rounded-md p-2 bg-[#393A3E] flex-grow hover:cursor-pointer items-center justify-center overflow-hidden"
              onMouseEnter={() => setHoveredContainer("weather")}
              onMouseLeave={() => setHoveredContainer(null)}
            >
              <WeatherWidget />
              {hoveredContainer === "weather" && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-black text-white text-md px-2 py-1 rounded shadow-md z-10">
                  {descriptions.weather}
                </div>
              )}
            </div>
            <div
              className="lg:col-span-1 lg:row-span-1 flex flex-col space-y-3 h-full rounded-md pb-12 pt-2 pr-2 pl-2 bg-[#393A3E] flex-grow hover:cursor-pointer"
              onMouseEnter={() => setHoveredContainer("capacity")}
              onMouseLeave={() => setHoveredContainer(null)}
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
              className="lg:col-span-1 lg:row-span-1 flex flex-col space-y-3 h-full rounded-md p-2 bg-[#393A3E] flex-grow hover:cursor-pointer "
              onMouseEnter={() => setHoveredContainer("schedules")}
              onMouseLeave={() => setHoveredContainer(null)}
            >
              <h3 className="text-center text-lg font-bold">Schedules</h3>{" "}
              <table className="border-collapse border border-gray-800 w-full">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Track</th>
                    <th>Priority</th>
                    <th>Assigned To</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.id}</td>
                      <td>{task.track_id}</td>
                      <td>{task.priority}</td>
                      <td>{task.assigned_to}</td>
                      <td>{task.status}</td>
                      <td>
                        <button
                          className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                        >
                          Delete
                        </button>
                        <button>
                          <Link
                            href={`/task/${task.id}`}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                          >
                            Edit
                          </Link>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

  