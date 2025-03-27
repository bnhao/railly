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
    <div className="h-80 rounded-md pb-12 pt-2 pr-2 pl-2 space-y-3 bg-[#393A3E]">
      <h3 className="text-center text-lg font-bold mb-4">Track Maintenance History</h3>
      <Bar data={data} options={options} />
    </div>
  );
}
