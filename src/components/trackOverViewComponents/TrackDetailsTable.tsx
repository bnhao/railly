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
    <div className="rounded-md p-2 bg-[#393A3E]">
      <h3 className="text-center text-lg font-bold mb-4">Selected Track Details</h3>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <tbody>
            <tr className="bg-black text-white">
              <td className="p-2 font-medium">Track ID</td>
              <td className="p-2">{details["@id"]}</td>
            </tr>
            <tr className="bg-gray-800 text-gray-200">
              <td className="p-2 font-medium">Name</td>
              <td className="p-2">{details.name}</td>
            </tr>
            <tr className="bg-gray-800 text-gray-200">
              <td className="p-2 font-medium">Operator</td>
              <td className="p-2">{details.operator}</td>
            </tr>
            <tr className="bg-gray-800 text-gray-200">
              <td className="p-2 font-medium">Electrified</td>
              <td className="p-2">{details.electrified}</td>
            </tr>
            <tr className="bg-black text-white">
              <td className="p-2 font-medium">Gauge</td>
              <td className="p-2">{details.gauge}</td>
            </tr>
            <tr className="bg-gray-800 text-white">
              <td className="p-2 font-medium">Max Speed</td>
              <td className="p-2">{details.maxspeed}</td>
            </tr>
            <tr className="bg-gray-800 text-gray-200">
              <td className="p-2 font-medium">Work Rules </td>
              <td className="p-2">{details.workrules}</td>
            </tr>
            <tr className="bg-black text-white">
              <td className="p-2 font-medium">Service</td>
              <td className="p-2">{details.service}</td>
            </tr>
            <tr className="bg-black text-white">
              <td className="p-2 font-medium">usage</td>
              <td className="p-2">{details.usage}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-4 text-center">
          <button
            className={`px-4 py-2 rounded-md ${isFavorite ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"} text-white`}
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

