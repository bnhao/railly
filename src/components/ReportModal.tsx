// 📁 Updated components/ReportModal.tsx with bar chart instead of heat map

"use client";

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Task {
  id: number;
  title: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

const getWeekDates = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1); // Monday
  const week: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    week.push(date.toISOString().split("T")[0]);
  }
  return week;
};

export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const containerRef = useRef(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weekDates, setWeekDates] = useState<string[]>([]);

  useEffect(() => {
    setWeekDates(getWeekDates());
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTasks = async () => {
      try {
        const response = await fetch("/api/tasks");
        if (!response.ok) throw new Error("Failed to fetch tasks");
        const data = await response.json();

        const formatted = data.map((task: Task) => ({
          ...task,
          start_date: task.start_date.includes("T")
            ? task.start_date.split("T")[0]
            : task.start_date,
        }));

        setTasks(formatted);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    };

    fetchTasks();
  }, [isOpen]);

  const chartData = weekDates.map((date) => {
    const pending = tasks.filter(
      (t) => t.status === "Pending" && t.start_date === date
    ).length;
    const inProgress = tasks.filter(
      (t) => t.status === "In Progress" && t.start_date === date
    ).length;
    return { date, Pending: pending, "In Progress": inProgress };
  });

  const downloadPDF = async () => {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    pdf.save("weekly-task-bar-report.pdf");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white p-6 rounded-lg w-[95%] max-w-5xl shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Weekly Task Bar Chart</h2>
        <div ref={containerRef} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Pending" fill="#FFA500" />
              <Bar dataKey="In Progress" fill="#008000" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-500"
          >
            Close
          </button>
          <button
            onClick={downloadPDF}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
