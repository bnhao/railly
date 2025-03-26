"use client";
import React, { useEffect, useState } from "react";
import Nav from "@/components/navbar";
import RailwayMap from "@/components/railwayMap";
import TrackMaintenanceChart from "@/components/trackOverViewComponents/TrackMaintenanceChart";
import TrackDetailsTable from "@/components/trackOverViewComponents/TrackDetailsTable";
import TrackCapacityChart from "@/components/trackOverViewComponents/TrackCapacityChart";
import SearchBar from "@/components/trackOverViewComponents/SearchBar";
import {
  trackDetails,
  trackMaintenanceData,
  trackCapacityData,
} from "@/data/trackData";
import { CHART_LABELS, CHART_BACKGROUND_COLORS, CHART_OPTIONS } from "@/data/chartConfig";
import { Task } from "../schedule/page";

export default function TrackOverview() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTrack, setSelectedTrack] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [favoriteTracks, setFavoriteTracks] = useState<string[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<{ properties: Record<string, any> } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTrackDetails, setSelectedTrackDetails] = useState<Task | null>(null);

  // Fetch Tasks
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

  // Handle track selection
  const handleTrackSelection = (trackId: string) => {
    setSelectedTrack(trackId);
    const trackDetails = tasks.find((task) => task.track_id === trackId);
    setSelectedTrackDetails(trackDetails || null);
  };

  // Handle toggling favorites
  const toggleFavorite = () => {
    setFavoriteTracks((prev) =>
      prev.includes(selectedTrack)
        ? prev.filter((t) => t !== selectedTrack)
        : [...prev, selectedTrack]
    );
  };

  const isFavorite = favoriteTracks.includes(selectedTrack);

  // Prepare maintenance history data for the selected track
  const selectedMaintenanceData = trackMaintenanceData[selectedTrack];
  const maintenanceHistoryData = {
    labels: CHART_LABELS,
    datasets: [
      {
        label: `${selectedTrack} Maintenance Count`,
        data: selectedMaintenanceData,
        backgroundColor: CHART_BACKGROUND_COLORS,
      },
    ],
  };

  return (
    <div className="flex">
      <Nav />
      <div className="p-6 bg-background text-foreground w-full">
        <div className="flex flex-row space-x-2">
          <div className="mb-4 mt-7">
            <SearchBar
              tracks={Object.keys(trackDetails)}
              onTrackSelect={(track) => handleTrackSelection(track)}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          </div>

          <div className="mb-4 flex gap-4 items-center">
            <div>
              <label htmlFor="date" className="block mb-1 text-darkgrey font-medium">
                Select Date:
              </label>
              <input
                type="date"
                id="date"
                className="p-1.5 border rounded-md text-black"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-1">
            <label htmlFor="favorites" className="block mb-1 text-darkgrey font-medium">
              Current Tracks:
            </label>
            <select
              id="favorites"
              className="p-2 border rounded-md text-black"
              value={selectedTrack}
              onChange={(e) => handleTrackSelection(e.target.value)}
            >
              <option value="">Select a Track</option>
              {tasks.map((task) => (
                <option key={task.track_id} value={task.track_id}>
                  {task.track_id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <TrackMaintenanceChart data={maintenanceHistoryData} options={CHART_OPTIONS} />
            {selectedFeature ? (
              <TrackDetailsTable
                details={selectedFeature.properties}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
              />
            ) : (
              <div className="rounded-md p-4 bg-[#393A3E] text-center text-white">
                No track selected.
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="h-[400px] rounded-md bg-gray-200 overflow-hidden">
              <RailwayMap onFeatureSelect={setSelectedFeature} />
            </div>
            <TrackCapacityChart data={trackCapacityData} options={CHART_OPTIONS} />
          </div>
        </div>

        {/* Selected Track Details */}
        {selectedTrackDetails && (
          <div className="mt-8 p-4 bg-gray-800 rounded-md text-white">
            <h2 className="text-lg font-semibold">Selected Track Details</h2>
            <p><strong>Track ID:</strong> {selectedTrackDetails.track_id}</p>
            <p><strong>Status:</strong> {selectedTrackDetails.status}</p>
            <p><strong>Title:</strong> {selectedTrackDetails.title}</p>
            <p><strong>Description:</strong> {selectedTrackDetails.description}</p>
            <p><strong>Start Date:</strong> {selectedTrackDetails.start_date}</p>
            <p><strong>End Date:</strong> {selectedTrackDetails.end_date}</p>
            <p><strong>Assigned To:</strong> {selectedTrackDetails.assigned_to}</p>
            <p><strong>Priority:</strong> {selectedTrackDetails.priority}</p>
          </div>
        )}
      </div>
    </div>
  );
}
