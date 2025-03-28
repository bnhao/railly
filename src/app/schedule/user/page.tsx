"use client";

import { useState, useEffect, useMemo } from "react";
import { useNextCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import {
  createViewDay,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
} from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import "@schedule-x/theme-default/dist/index.css";
import Modal from "@/components/modal";
import TaskDetailsModal from "@/components/detailsModal";
import "@/app/schedule/schedule.css";
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

export default function Schedule() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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
    const fetchGeoJSON = async () => {
      try {
        const response = await fetch("/Alberta.geojson");
        if (!response.ok) throw new Error("Failed to fetch GeoJSON data");

        const albertaGeoJSON = await response.json();

        const coordinatesMap = albertaGeoJSON.features.reduce(
          (acc: any, feature: any) => {
            const trackId = feature.properties["@id"];
            acc[trackId] = feature.geometry.coordinates;
            return acc;
          },
          {}
        );

        setTrackCoordinates(coordinatesMap);
      } catch (error) {
        console.error("Error fetching GeoJSON:", error);
      }
    };

    fetchGeoJSON();
  }, []);

  useEffect(() => {
    const fetchGeoJSON = async () => {
      try {
        const response = await fetch("/Alberta.geojson");
        if (!response.ok) throw new Error("Failed to fetch GeoJSON data");

        const albertaGeoJSON = await response.json();

        const coordinatesMap = albertaGeoJSON.features.reduce(
          (acc: any, feature: any) => {
            const trackId = feature.properties["@id"];
            acc[trackId] = feature.geometry.coordinates;
            return acc;
          },
          {}
        );

        setTrackCoordinates(coordinatesMap);
      } catch (error) {
        console.error("Error fetching GeoJSON:", error);
      }
    };

    fetchGeoJSON();
  }, []);

  const calculateMidpoint = (coordinates: [number, number][]) => {
    console.log("Calculating midpoint for coordinates:", coordinates);
    if (!coordinates || coordinates.length === 0) return null;
    console.error("No valid coordinates provided");

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
      <div className="flex flex-col h-screen bg-black text-white">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-gray-800">
          <button
            className="bg-gray-700 px-6 py-2 rounded-full cursor-pointer hover:bg-gray-600"
            onClick={() =>
              setViewMode(viewMode === "calendar" ? "table" : "calendar")
            }
          >
            {viewMode === "calendar"
              ? "Switch to Table View"
              : "Switch to Calendar View"}
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-grow flex flex-col">
          {viewMode === "calendar" ? (
            <div className="sx-react-calendar-wrapper w-full h-full flex-grow">
              <ScheduleXCalendar calendarApp={calendar} />
            </div>
          ) : (
            <div className="w-full h-full flex-grow overflow-hidden">
              <h1 className="text-2xl font-bold mb-4 text-white px-6">
                Scheduled Tasks
              </h1>
              <div className="overflow-auto h-full px-6">
                <table className="border-collapse border border-gray-800 w-full">
                  <thead>
                    <tr>
                      <th className="border border-gray-800">Order ID</th>
                      <th className="border border-gray-800">Track ID</th>
                      <th className="border border-gray-800">Status</th>
                      <th className="border border-gray-800">Title</th>
                      <th className="border border-gray-800">Description</th>
                      <th className="border border-gray-800">Start Date</th>
                      <th className="border border-gray-800">Start Time</th>
                      <th className="border border-gray-800">End Date</th>
                      <th className="border border-gray-800">End Time</th>
                      <th className="border border-gray-800">Assigned To</th>
                      <th className="border border-gray-800">Priority</th>
                      <th className="border border-gray-800">
                        Midpoint Coordinates
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id}>
                        <td className="border border-gray-300">#{task.id}</td>
                        <td className="border border-gray-300">
                          #{task.track_id}
                        </td>
                        <td className="border border-gray-300">{task.status}</td>
                        <td className="border border-gray-300">{task.title}</td>
                        <td className="border border-gray-300">
                          {task.description}
                        </td>
                        <td className="border border-gray-300">
                          {task.start_date}
                        </td>
                        <td className="border border-gray-300">
                          {task.start_time}
                        </td>
                        <td className="border border-gray-300">
                          {task.end_date}
                        </td>
                        <td className="border border-gray-300">
                          {task.end_time}
                        </td>
                        <td className="border border-gray-300">
                          {task.assigned_to}
                        </td>
                        <td className="border border-gray-300">
                          {task.priority}
                        </td>
                        <td>
                          {task.coordinates
                            ? JSON.stringify(task.coordinates)
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
    );
  }
}
