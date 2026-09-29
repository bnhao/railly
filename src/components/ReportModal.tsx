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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e2128] border border-gray-800/50 p-8 rounded-2xl w-[95%] max-w-5xl shadow-2xl shadow-black/50">
        <h2 className="font-bold text-2xl text-cyan-400 tracking-wide drop-shadow-[0_0_8px_rgba(6,182,212,0.4)] mb-8">Weekly Task Bar Chart</h2>
        <div ref={containerRef} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="date" stroke="#9ca3af" tick={{fill: "#9ca3af"}} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} stroke="#9ca3af" tick={{fill: "#9ca3af"}} tickLine={false} axisLine={false} />
              <Tooltip cursor={{fill: "rgba(255,255,255,0.05)"}} contentStyle={{backgroundColor: "#181a20", borderColor: "#374151", borderRadius: "8px", color: "#f3f4f6"}} />
              <Legend />
              <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="In Progress" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="rounded-xl bg-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-700 hover:text-gray-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={downloadPDF}
            className="rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-500/20"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
