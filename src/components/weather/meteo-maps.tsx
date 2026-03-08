"use client";
import { useEffect, useState } from "react";

type WeathermapProps = {
    track: string; // The selected track ID
};

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
    track_id: string; // Track ID to match
    coordinates: [number, number][]; // Coordinates for the track
};

export default function WeatherMap({ track }: WeathermapProps) {
    const [tasks, setTasks] = useState<Task[]>([]);

    // Fetch tasks from the backend
    const fetchTasks = async () => {
        const tasks = await fetch("/api/tasks").then((res) => res.json());
        return tasks;
    };

    useEffect(() => {
        const fetchAndSetTasks = async () => {
            const tasks = await fetchTasks();
            setTasks(tasks);
        };
        fetchAndSetTasks();
    }, []);

    // Find the task that matches the selected track ID
    const selectedTask = tasks.find((task) => task.track_id === track);

    return (
        <div className="col-span-6 h-full">
            <h2 className="text-lg font-semibold bg-emerald-950 px-4 py-2 rounded">
                Meteoblue Weather Map for Selected Track
            </h2>
            <div className="mt-4">
                {selectedTask?.coordinates && selectedTask.coordinates.length > 0 ? (
                    <iframe
                        src={`https://www.meteoblue.com/en/weather/maps/widget?lat=${selectedTask.coordinates[0][0]}&lon=${selectedTask.coordinates[0][1]}&zoom=8&tempunit=C&windunit=km/h&lengthunit=metric`}
                        frameBorder="0"
                        scrolling="no"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
                        style={{ width: "100%", height: "420px", borderRadius: "10px" }}
                        title="Meteoblue Weather Map"
                    ></iframe>
                ) : (
                    <p className="text-gray-500 text-center">
                        No map available for the selected track.
                    </p>
                )}
            </div>
        </div>
    );
}


