"use client";
import { Loader } from "@googlemaps/js-api-loader";
import React, { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import Nav from "@/components/navbar";
import Link from "next/link";
import dynamic from "next/dynamic";
import useForecast from "../hooks/useForecast";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import WeatherWidget from "@/components/weather/WeatherWidget";
import RailwayMap from "@/components/railwayMap";


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
  const [selectedFeatture, setSelectedFeature] = useState(null);
  const { forecastData } = useForecast();
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Initialize Google Maps
  useEffect(() => {
    if (!googleMapsApiKey) {
      console.error("Google Maps API key is missing.");
      return;
    }

    const loader = new Loader({
      apiKey: googleMapsApiKey,
    });

    loader.load().then(() => {
      if (mapRef.current) {
        new google.maps.Map(mapRef.current, {
          center: { lat: 51.0447, lng: -114.0719 }, // Calgary, Alberta
          zoom: 13,
        });
      }
    });
  }, [googleMapsApiKey]);

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

  // Dynamically import the CombinedMap component

  // Fetch tasks on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      const tasks = await getTasks();
      setTasks(tasks);
    };
    fetchTasks();
  }, []);

  // Mock data for track capacity (Line Chart)
  const trackCapacityData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Track 1",
        data: [200, 220, 210, 250, 240, 230, 260, 300, 320, 350, 370, 400],
        borderColor: "rgba(255, 99, 132, 1)",
        fill: false,
      },
      {
        label: "Track 2",
        data: [170, 190, 220, 230, 250, 240, 250, 260, 270, 320, 330, 370],
        borderColor: "rgba(54, 162, 235, 1)",
        fill: false,
      },
      {
        label: "Track 3",
        data: [130, 170, 180, 200, 210, 180, 190, 220, 270, 300, 320, 340],
        borderColor: "rgba(255, 206, 86, 1)",
        fill: false,
      },
      {
        label: "Track 4",
        data: [150, 150, 160, 180, 190, 200, 220, 230, 250, 270, 290, 310],
        borderColor: "rgba(75, 192, 192, 1)",
        fill: false,
      },
      {
        label: "Track 5",
        data: [150, 145, 150, 160, 170, 190, 210, 230, 240, 260, 280, 300],
        borderColor: "rgba(153, 102, 255, 1)",
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  const forecast = forecastData["Banff"];

  return (
    // <ProtectedRoute allowedRoles={["admin", "user"]}>
      <div className="flex">
        <Nav />
        <div className="px-6 bg-background text-foreground w-full h-screen flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 gap-6 h-full">
            <div
              className="lg:col-span-1 lg:row-span-1 flex flex-col space-y-3 h-full rounded-md p-2 bg-[#393A3E] flex-grow hover:cursor-pointer items-center justify-center overflow-hidden"
              onClick={() => router.push("/weather")}
            >
              <WeatherWidget />
            </div>
            <div
              className="lg:col-span-1 lg:row-span-1 flex flex-col space-y-3 h-full rounded-md p-2 bg-[#393A3E] hover:cursor-pointer"
              onClick={() => router.push("/trackOverview")}
            >
              <h3 className="text-center text-lg font-bold">Track Capacity</h3>
              <Line data={trackCapacityData} options={chartOptions} />
            </div>
            <div
              className="lg:col-span-1 lg:row-span-1 flex flex-col space-y-3 h-full rounded-md p-2 bg-[#393A3E] flex-grow hover:cursor-pointer "
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
            </div>
            <div className="lg:col-span-1 lg:row-span-1 h-full rounded-md p-2 bg-[#393A3E] flex-grow hover:cursor-pointer">
              <RailwayMap onFeatureSelect={setSelectedFeature} />
            </div>
          </div>
        </div>
      </div>
    // </ProtectedRoute>
  );
}
