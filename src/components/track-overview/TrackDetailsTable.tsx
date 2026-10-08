"use client";
import React, { useState } from "react";

interface TrackDetailsTableProps {
  details: any;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const TrackDetailsTable: React.FC<TrackDetailsTableProps> = ({
  details,
  isFavorite,
  onToggleFavorite,
}) => {
  const [railwayData, setRailwayData] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);

  return (
    <div className="rounded-xl p-6 bg-[#1e2128] shadow-lg shadow-black/20 flex-grow hover:cursor-pointer border border-gray-800/50">
      <h3 className="text-lg font-semibold text-gray-100 mb-6 text-center">Selected Track Details</h3>
      <div className="overflow-hidden rounded-lg border border-gray-800/50">
        <table className="w-full text-sm">
          <tbody>
            <tr className="bg-[#181a20] text-gray-200 border-b border-gray-800/50">
              <td className="p-3 font-medium text-gray-400">Track ID</td>
              <td className="p-3 font-mono text-cyan-400">{details["@id"]}</td>
            </tr>
            <tr className="bg-[#1e2128] text-gray-200 border-b border-gray-800/50">
              <td className="p-3 font-medium text-gray-400">Name</td>
              <td className="p-3 font-mono text-cyan-400">{details.name}</td>
            </tr>
            <tr className="bg-[#1e2128] text-gray-200 border-b border-gray-800/50">
              <td className="p-3 font-medium text-gray-400">Operator</td>
              <td className="p-3 font-mono text-cyan-400">{details.operator}</td>
            </tr>
            <tr className="bg-[#1e2128] text-gray-200 border-b border-gray-800/50">
              <td className="p-3 font-medium text-gray-400">Electrified</td>
              <td className="p-3 font-mono text-cyan-400">{details.electrified}</td>
            </tr>
            <tr className="bg-[#181a20] text-gray-200 border-b border-gray-800/50">
              <td className="p-3 font-medium text-gray-400">Gauge</td>
              <td className="p-3 font-mono text-cyan-400">{details.gauge}</td>
            </tr>
            <tr className="bg-[#1e2128] text-gray-200 border-b border-gray-800/50">
              <td className="p-3 font-medium text-gray-400">Max Speed</td>
              <td className="p-3 font-mono text-cyan-400">{details.maxspeed}</td>
            </tr>
            <tr className="bg-[#1e2128] text-gray-200 border-b border-gray-800/50">
              <td className="p-3 font-medium text-gray-400">Work Rules </td>
              <td className="p-3 font-mono text-cyan-400">{details.workrules}</td>
            </tr>
            <tr className="bg-[#181a20] text-gray-200 border-b border-gray-800/50">
              <td className="p-3 font-medium text-gray-400">Service</td>
              <td className="p-3 font-mono text-cyan-400">{details.service}</td>
            </tr>
            <tr className="bg-[#181a20] text-gray-200 border-b border-gray-800/50">
              <td className="p-3 font-medium text-gray-400">usage</td>
              <td className="p-3 font-mono text-cyan-400">{details.usage}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-4 text-center">
          <button
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors duration-200 shadow-lg ${isFavorite ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 shadow-red-500/10 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shadow-emerald-500/10 border border-emerald-500/20"}`}
            onClick={onToggleFavorite}
          >
            {isFavorite ? "Remove from Favorite" : "Add to Favorite"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackDetailsTable;

