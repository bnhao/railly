"use client";
import React, { memo } from "react";
import { Star, Plus } from "lucide-react";

interface TrackDetailsTableProps {
  details: Record<string, unknown>;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  canDispatch?: boolean;
  onDispatch?: () => void;
}

const SPEC_ROWS: { key: string; label: string }[] = [
  { key: "@id", label: "Track ID" },
  { key: "name", label: "Subdivision / Name" },
  { key: "operator", label: "Operator" },
  { key: "service", label: "Track Service" },
  { key: "usage", label: "Corridor Usage" },
  { key: "gauge", label: "Gauge (mm)" },
  { key: "maxspeed", label: "Max Speed" },
  { key: "electrified", label: "Electrified" },
];

const TrackDetailsTable: React.FC<TrackDetailsTableProps> = ({
  details,
  isFavorite,
  onToggleFavorite,
  canDispatch = false,
  onDispatch,
}) => {
  return (
    <div className="rounded-xl p-5 bg-[#151921] border border-[#242a36] widget-contain space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-100">
          Selected Track Telemetry
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              isFavorite
                ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                : "bg-[#0d1015] text-gray-300 border-[#242a36] hover:bg-[#1b202b]"
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${isFavorite ? "fill-amber-400" : ""}`}
            />
            {isFavorite ? "Bookmarked" : "Bookmark"}
          </button>

          {canDispatch && onDispatch && (
            <button
              type="button"
              onClick={onDispatch}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Dispatch Order
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#242a36]">
        <table className="w-full text-xs">
          <tbody className="divide-y divide-[#242a36]/70">
            {SPEC_ROWS.map((row) => {
              const rawVal = details[row.key];
              const display =
                rawVal !== undefined && rawVal !== null && String(rawVal) !== ""
                  ? String(rawVal)
                  : "—";
              return (
                <tr key={row.key} className="bg-[#0d1015]">
                  <th
                    scope="row"
                    className="px-3.5 py-2.5 text-left font-medium text-gray-400 w-40"
                  >
                    {row.label}
                  </th>
                  <td className="px-3.5 py-2.5 font-mono text-cyan-300">
                    {display}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default memo(TrackDetailsTable);
