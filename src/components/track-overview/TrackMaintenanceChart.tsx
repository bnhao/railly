"use client";
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register required Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function TrackMaintenanceChart({
  data,
  options,
}: {
  data: any;
  options: any;
}) {
  return (
    <div className="h-80 rounded-xl p-6 flex flex-col bg-[#1e2128] shadow-lg shadow-black/20 border border-gray-800/50">
      <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-100">Track Maintenance History</h3></div>
      <div className="relative flex-1 w-full min-h-0">
      <Bar data={data} options={options} />
      </div>
    </div>
  );
}
