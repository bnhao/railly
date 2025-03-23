"use client";
import React, { use, useEffect, useState } from "react";
import Nav from "@/components/navbar";
// import CombinedMap from "@/components/trackOverViewComponents/CombinedMap";
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
import { trackCoordinates } from "@/data/trackLocations";
import {
  CHART_LABELS,
  CHART_BACKGROUND_COLORS,
  CHART_OPTIONS,
} from "@/data/chartConfig"; // ✅ Import constants
import { Task } from "../schedule/page";

export default function TrackOverview() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTrack, setSelectedTrack] = useState<string>("Track 1");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [favoriteTracks, setFavoriteTracks] = useState<string[]>([]);
  const [selectedFeature, setSelectedFeature] = useState(null);

  const [tasks, setTasks] = useState<Task[]>([]);

  // Handle toggling favorites
  const toggleFavorite = () => {
    setFavoriteTracks((prev) =>
      prev.includes(selectedTrack)
        ? prev.filter((t) => t !== selectedTrack)
        : [...prev, selectedTrack]
    );
  };

  // Check if selected track is in favorites
  const isFavorite = favoriteTracks.includes(selectedTrack);

  // Handle favorite track selection
  // const handleFavoriteSelect = (track: string) => {
  //   setSelectedTrack(track);
  //   setSearchTerm(""); // Clear the search bar
  // };

  // Prepare maintenance history data for the selected track
  const selectedMaintenanceData = trackMaintenanceData[selectedTrack];
  const maintenanceHistoryData = {
    labels: CHART_LABELS, // ✅ Use chart labels from config
    datasets: [
      {
        label: `${selectedTrack} Maintenance Count`,
        data: selectedMaintenanceData,
        backgroundColor: CHART_BACKGROUND_COLORS, // ✅ Use colors from config
      },
    ],
  };

  //Fetch Tasks
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
    


  return (
    <div className="flex">
      <Nav />
      <div className="p-6 bg-background text-foreground w-full">
        <div className="flex flex-row space-x-2">
          <div className="mb-4 mt-7">
            <SearchBar
              tracks={Object.keys(trackDetails)}
              onTrackSelect={(track) => setSelectedTrack(track)}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          </div>

          <div className="mb-4 flex gap-4 items-center">
            <div>
              <label
                htmlFor="date"
                className="block mb-1 text-darkgrey font-medium"
              >
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
            <label
              htmlFor="favorites"
              className="block mb-1 text-darkgrey font-medium"
            >
              Current Tracks:
            </label>
            <select
              id="favorites"
              className="p-2 border rounded-md text-black"
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
            >
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
            <TrackMaintenanceChart
              data={maintenanceHistoryData}
              options={CHART_OPTIONS}
            />
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
            <TrackCapacityChart
              data={trackCapacityData}
              options={CHART_OPTIONS}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
