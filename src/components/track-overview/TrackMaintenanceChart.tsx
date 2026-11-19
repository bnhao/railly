"use client";
import React, { memo } from "react";
import { BarBreakdownChart, BarSeriesItem } from "@/components/ui/MiniCharts";

interface TrackMaintenanceChartProps {
  items: BarSeriesItem[];
  trackLabel?: string;
}

function TrackMaintenanceChart({
  items,
  trackLabel,
}: TrackMaintenanceChartProps) {
  return (
    <div className="rounded-xl p-5 flex flex-col bg-[#151921] border border-[#242a36] widget-contain space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-100">
          Maintenance History{trackLabel ? ` · ${trackLabel}` : ""}
        </h2>
        <span className="text-[11px] font-mono text-gray-500">
          Work orders by month
        </span>
      </div>
      <BarBreakdownChart
        items={items}
        primaryLabel="Maintenance Orders"
        primaryColor="bg-cyan-500"
        emptyText="Select a track or subdivision to inspect its maintenance history."
      />
    </div>
  );
}

export default memo(TrackMaintenanceChart);
