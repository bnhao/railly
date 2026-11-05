"use client";
import { useNextCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { MapPin, Edit2, Trash2 } from "lucide-react";
import ReportModal from "@/components/ReportModal";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { useState, useEffect, useMemo } from "react";
import {
  createViewDay,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
} from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import "@schedule-x/theme-default/dist/index.css";
import Modal from "@/components/Modal";
import TaskDetailsModal from "@/components/DetailsModal";
import "@/app/schedule/schedule.css";
import { getRailwayGeoJSON } from "@/utils/railwayDataCache";
// Task Type Definition
export type Task = {
  id: number;
  title: string;
  description: string;
  status: string;
  assigned_to: number;
  created_by: string;
  due_date: string;
  priority: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  track_id: string;
  coordinates: [number, number][];
};

export default function ScheduleClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [trackCoordinates, setTrackCoordinates] = useState<{
    [key: string]: [number, number][];
  }>({});
  const [viewMode, setViewMode] = useState("calendar"); // Default view mode

  const eventsService = useState(() => createEventsServicePlugin())[0];

  useEffect(() => {
    const fetchTasks = async () => {
      const fetchedTasks = await getTasks();
      setTasks(fetchedTasks);
      setLoading(false);
    };

    fetchTasks();
  }, []);

  const currentWeekTasks = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    return tasks.filter((task) => {
      const date = parseISO(task.start_date);
      return isWithinInterval(date, { start, end });
    });
  }, [tasks]);

  // Fetch all tasks
  const getTasks = async (): Promise<Task[]> => {
    try {
      const response = await fetch("/api/tasks", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const data = await response.json();

      // Format dates to match the calendar's expected format
      const formattedTasks = data.map((task: Task) => ({
        ...task,
        start_date: task.start_date.split("T")[0], // Extract YYYY-MM-DD
        end_date: task.end_date.split("T")[0], // Extract YYYY-MM-DD
      }));

      console.log("Formatted tasks:", formattedTasks); // Debugging
      return formattedTasks;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }
  };
  useEffect(() => {
    let isMounted = true;
    getRailwayGeoJSON()
      .then((albertaGeoJSON) => {
        if (!isMounted || !albertaGeoJSON?.features) return;
        const coordinatesMap = albertaGeoJSON.features.reduce(
          (acc: any, feature: any) => {
            const trackId = feature.properties["@id"];
            acc[trackId] = feature.geometry.coordinates;
            return acc;
          },
          {}
        );
        setTrackCoordinates(coordinatesMap);
      })
      .catch((error) => {
        console.error("Error fetching GeoJSON:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const calculateMidpoint = (coordinates: [number, number][]) => {
    console.log("Calculating midpoint for coordinates:", coordinates);
    if (!coordinates || coordinates.length === 0) {
      console.error("No valid coordinates provided", coordinates);
      return null;
    }
    
    if (coordinates.length === 1) {
      console.log("Only one coordinate, returning:", coordinates[0]);
      return coordinates[0];
    }
    if (coordinates.length === 2) {
      console.log(
        "Exactly two coordinates provided, returning both:",
        coordinates
      );
      return coordinates; // Return both coordinates instead of calculating a midpoint
    }
    const numCoordinates = coordinates.length;
    if (numCoordinates % 2 === 1) {
      // Odd number of coordinates: return the middle coordinate
      return coordinates[Math.floor(numCoordinates / 2)];
    } else {
      // Even number of coordinates: average the two middle coordinates
      const mid1 = coordinates[numCoordinates / 2 - 1];
      const mid2 = coordinates[numCoordinates / 2];
      return [(mid1[0] + mid2[0]) / 2, (mid1[1] + mid2[1]) / 2];
    }
  };

  // Handle adding a new task
  const handleAddTask = async (
    title: string,
    description: string,
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string,
    assignedTo: number,
    priority: string,
    status: string,
    trackId: string // User inputs this
  ) => {
    const due_date = `${endDate}T${endTime}:00`;
    console.log("Selected Track ID:", trackId);
    // console.log("Available Track IDs:", Object.keys(trackCoordinates));

    if (!trackCoordinates || Object.keys(trackCoordinates).length === 0) {
      console.log(
        "All Track IDs in trackCoordinates:",
        Object.keys(trackCoordinates)
      );
      console.error("No track coordinates found");
      return;
    }

    const formattedTrackId = trackId.startsWith("node/")
      ? trackId
      : trackId.startsWith("way/")
      ? trackId
      : `way/${trackId}`;
    console.log("Formatted Track ID:", formattedTrackId);

    // Fetch coordinates for the selected track
    const coordinates = trackCoordinates[trackId.toString()];
    if (!coordinates) {
      console.error("Invalid Track ID: Coordinates not found");
      return;
    }

    console.log("Coordinates for selected track:", coordinates);

    // Calculate the midpoint
    const midpoint = calculateMidpoint(coordinates);
    console.log("Midpoint calculated:", midpoint);
    if (!midpoint) {
      console.error("No valid midpoint found for the selected track");
      return;
    }

    const newTask = {
      title,
      description,
      status,
      assigned_to: assignedTo,
      created_by: "Admin",
      due_date,
      start_date: startDate,
      start_time: startTime,
      end_date: endDate,
      end_time: endTime,
      priority,
      track_id: trackId, // Save the track ID
      coordinates: [midpoint], // Save the midpoint
    };

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error("Failed to add task");
      }

      const createdTask = await response.json();

      setTasks((prevTasks) => [...prevTasks, createdTask]);

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding task:", error);
    }
    console.log("Request data being sent:", JSON.stringify(newTask, null, 2));

    try {
      const response = await fetch("/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error("Failed to add task to history");
      }

      const createdTask = await response.json();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
        setIsDetailsModalOpen(false);
      } else {
        console.error("Failed to delete task:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Transform tasks for Schedule-X format
  const events = useMemo(() => {
    return tasks.map((task) => ({
      id: task.id.toString(),
      title: task.title,
      start: task.start_date, // Already formatted as YYYY-MM-DD
      end: task.end_date, // Already formatted as YYYY-MM-DD
    }));
  }, [tasks]);

  const calendar = useNextCalendarApp({
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    defaultView: "week",
    events,
    plugins: [eventsService],
    callbacks: {
      onRender: () => eventsService.getAll(),
      onEventClick: (event) => {
        const foundTask = tasks.find((task) => task.id.toString() === event.id);
        if (foundTask) {
          setSelectedTask(foundTask);
          setIsDetailsModalOpen(true);
        }
      },
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  } else {
    return (
      <ProtectedRoute allowedRoles={["admin", "user"]}>
        <div className="flex">
        {/* Modal for adding a task */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddTask={handleAddTask}
        />
        <div className="bg-black text-white w-full min-h-screen px-6 mt-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-4">
              {role === "admin" && (<button
                className="bg-cyan-600 px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-500/20"
                onClick={() => setIsModalOpen(true)}
              >
                Schedule
              </button>)}
              {role === "admin" && (<button
                className="bg-cyan-600/10 border border-cyan-500/30 px-6 py-2.5 rounded-xl font-semibold text-sm text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                onClick={() => setIsReportOpen(true)}
              >
                Generate Report
              </button>)}
            </div>
            <button
              className="bg-[#1e2128] border border-gray-700 px-6 py-2.5 rounded-xl font-semibold text-sm text-gray-300 hover:bg-gray-800 transition-colors"
              onClick={() =>
                setViewMode(viewMode === "calendar" ? "table" : "calendar")
              }
            >
              {viewMode === "calendar"
                ? "Switch to Table View"
                : "Switch to Calendar View"}
            </button>
          </div>

          {role === "admin" && <ReportModal
            isOpen={isReportOpen}
            onClose={() => setIsReportOpen(false)}
            tasks={currentWeekTasks}
          />}
          {/* Conditional Rendering for Calendar or Table View */}
          {/* {viewMode === "calendar" ? (
            <div className="sx-react-calendar-wrapper w-full h-full flex-grow mt-4">
            </div>
          ) : ( */}
            <div className="mt-8 w-full h-full flex-grow">
              <h1 className="text-2xl font-bold mb-4 text-white">
                Scheduled Tasks
              </h1>
              <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-[#181a20] text-xs uppercase text-gray-500 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 font-medium border-b border-gray-800">Task ID</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-800">Track ID</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-800">Title & Details</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-800">Assigned To</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-800">Schedule</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-800">Status</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-800 text-center">Map</th>
                      {role === "admin" && <th className="px-6 py-4 font-medium border-b border-gray-800 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-300">{task.id}</td>
                        <td className="px-6 py-4 font-mono text-cyan-400">#{task.track_id}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-200">{task.title}</div>
                          <div className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">{task.description}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{task.assigned_to}</td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs">{task.start_date} to {task.end_date}</div>
                          <div className="font-mono text-xs text-gray-500">{task.start_time} - {task.end_time}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            task.status.toLowerCase() === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            task.status.toLowerCase() === 'in progress' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {task.coordinates ? (
                            <a href={`/track-overview?track=${task.track_id}`} className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded transition-colors" title="View on Map">
                              <MapPin size={18} />
                            </a>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                                                {role === "admin" && (
                          <td className="px-6 py-4 flex justify-end gap-3 h-full items-center">
                            <Link
                              href={`/task/${task.id}`}
                              className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded transition-colors"
                              title="Edit Task"
                            >
                              <Edit2 size={18} />
                            </Link>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id);
                              }}
                              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          {/* )} */}
        </div>

        {/* Modal for adding a task */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddTask={handleAddTask}
        />

        {/* Modal for task details */}
        {selectedTask && (
          <TaskDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            task={selectedTask}
            onDelete={handleDeleteTask}
          />
        )}
      </div>
      </ProtectedRoute>
    );
  }
}
