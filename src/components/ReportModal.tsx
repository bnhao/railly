// 📁 Final updated components/ReportModal.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

const statusList = ["Pending", "In Progress"];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

export default function ReportModal({
  isOpen,
  onClose,
  tasks,
}: ReportModalProps) {
  const containerRef = useRef(null);
  const [weekDates, setWeekDates] = useState<string[]>([]);

  useEffect(() => {
    setWeekDates(getWeekDates());
  }, []);

  const gridData = useMemo(() => {
    const grid: Record<string, Record<string, number>> = {};
    statusList.forEach((status) => {
      grid[status] = {};
      weekDates.forEach((date) => {
        grid[status][date] = 0;
      });
    });

    tasks.forEach((task) => {
      const dateOnly = task.start_date.includes("T")
        ? task.start_date.split("T")[0]
        : task.start_date;
      const status = task.status;
      if (grid[status] && grid[status][dateOnly] !== undefined) {
        grid[status][dateOnly]++;
      }
    });

    return grid;
  }, [tasks, weekDates]);

  const downloadPDF = async () => {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    pdf.save("weekly-task-report.pdf");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white p-6 rounded-lg w-[90%] max-w-4xl shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Weekly Task Heat Map</h2>
        <div ref={containerRef} className="overflow-auto">
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-black text-white font-bold">
                <th className="border p-2">Status / Day</th>
                {weekDates.map((date, i) => (
                  <th key={date} className="border p-2">
                    {days[i]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statusList.map((status) => (
                <tr key={status}>
                  <td className="border p-2 font-bold text-black bg-white">
                    {status}
                  </td>
                  {weekDates.map((date) => {
                    const count = gridData[status][date];
                    const shade = `bg-blue-$
                      {count === 0 ? "50" : count < 3 ? "200" : count < 6 ? "400" : "600"}`;
                    return (
                      <td
                        key={date}
                        className={`border text-center p-2 text-white ${shade}`}
                      >
                        {count > 0 ? count : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
} // end
