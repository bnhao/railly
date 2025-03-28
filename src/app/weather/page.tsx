"use client";

import React, { JSX } from "react";
import SelectLocation from "../../components/weather/SelectLocation";
import useForecast from "../hooks/useForecast";
import Nav from "@/components/navbar";
import AIchatbot from "@/components/AIchatbot";

const App = (): JSX.Element => {
  const {
    selectedTrack,
    handleTrackChange,
    forecastData,
    predictWeatherData,
  } = useForecast();

  return (
    <div className="flex">
      <div className="bg-black text-white w-full min-h-screen px-6">
        <SelectLocation
          track={selectedTrack}
          forecastData={forecastData}
          handleTrackChange={handleTrackChange}
          predictWeatherData={predictWeatherData}

        />
      </div>
      <AIchatbot />
    </div>
  );
};

export default App;
