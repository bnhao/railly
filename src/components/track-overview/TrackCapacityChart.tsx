"use client";
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register required Chart.js components
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

export default function TrackCapacityChart({
  data,
  options,
}: {
  data: any;
  options: any;
}) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-100">Track Capacity</h2>
      </div>
      <div className="relative flex-1 w-full min-h-0">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
