"use client";
import React, { memo } from "react";
import { BarBreakdownChart, BarSeriesItem } from "@/components/ui/MiniCharts";

function TrackCapacityChart({ items }: { items: BarSeriesItem[] }) {
  return (
    <div className="flex flex-col h-full w-full space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-100">Track Capacity</h2>
      </div>
      <BarBreakdownChart items={items} primaryLabel="Load" />
    </div>
  );
}

export default memo(TrackCapacityChart);
