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
    <div className="lg:col-span-1 lg:row-span-1 flex flex-col space-y-3 h-full rounded-md bg-[#393A3E] flex-grow hover:cursor-pointer">
      <h3 className="text-center text-lg font-bold mb-4">Track Capacity</h3>
      <Line data={data} options={options} />
    </div>
  );
}
