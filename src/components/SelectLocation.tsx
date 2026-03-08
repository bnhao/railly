import { ChangeEvent, JSX } from "react";
import { forecastType, locationType } from "../app/types";
import { getWindDirection } from "@/app/helpers";
import { Chart as ChartJs, defaults, CategoryScale } from "chart.js/auto";
import { Line } from "react-chartjs-2";
import WeatherMap, { meteoMaps } from "@/components/meteo-maps";

ChartJs.register(CategoryScale);

type Props = {
  track: string;
  forecastData: { [key: string]: forecastType | null };
  handleTrackChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  predictWeatherData: { [key: string]: forecastType | null };
};

const SelectLocation = ({
  handleTrackChange,
  forecastData,
  track,
  predictWeatherData,
}: Props): JSX.Element => {
  const selectedForecast = track ? forecastData[track] : null;

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="grid grid-cols-12 gap-6">
        {/* // Current forecast per track */}
        <div className="col-span-4 space-y-4">
          <div className="bg-emerald-950 p-4 rounded">
            <h2 className="text-lg font-semibold">
              Current Forecast Per Track
            </h2>
          </div>

          {[
            "Vancouver",
            "Banff",
            "Edmonton",
            "Jasper",
            "Canmore",
            "Red Deer",
          ].map((trackName, i) => {
            const forecast = forecastData[trackName];
            return (
              <div key={i} className="bg-gray-800 p-4 rounded-[10px]">
                <h3 className="font-bold">{`Track ${i + 1} - ${trackName} (${forecast?.list[0].weather.main ?? "-"
                  })`}</h3>
                <p>
                  Wind Speed: {forecast?.list?.[0]?.wind?.speed ?? "-"} km/h
                </p>
                <p>Temperature: {forecast?.list?.[0]?.main?.temp ?? "-"}°C</p>
                <p>
                  Feels Like: {forecast?.list?.[0]?.main?.feels_like ?? "-"}°C
                </p>
                <p>Humidity: {forecast?.list?.[0]?.main?.humidity ?? "-"}%</p>
              </div>
            );
          })}
        </div>

        {/* Detailed Information for Selected Track */}
        <div className="col-span-8 space-y-4">
          <div className="flex justify-between items-center bg-emerald-950 p-4 rounded">
            <h2 className="text-lg font-semibold">Select a Track</h2>
            <select
              name="track"
              id="track"
              className="bg-gray-800 text-white border p-0.5 rounded cursor-pointer hover:bg-gray-700 transition"
              value={track}
              onChange={handleTrackChange}
            >
              <option value="">Select a Track</option>
              {[
                "Vancouver",
                "Banff",
                "Edmonton",
                "Jasper",
                "Canmore",
                "Red Deer",
              ].map((trackName, i) => (
                <option key={i} value={trackName}>
                  {`Track ${i + 1} - ${trackName}`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Wind Direction */}
            <div className="col-span-6">
              <h2 className="text-lg font-semibold bg-emerald-950 px-4 py-2 rounded">
                Wind Direction for Selected Track
              </h2>
              <div className="font-bold text-5xl h-40 bg-gray-800 rounded-[10px] mt-4 flex items-center justify-center">
                {selectedForecast?.list?.[0]?.wind?.deg !== undefined
                  ? `${getWindDirection(
                    Math.round(selectedForecast.list[0].wind.deg)
                  )}`
                  : "No data"}
              </div>
              {/* Wind Speed */}
              <h2 className="text-lg font-semibold bg-emerald-950 px-4 py-2 rounded mt-6">
                Wind Speed for Selected Track
              </h2>
              <div className="bg-gray-800 rounded-[10px] mt-4 p-3 flex items-center justify-center">
                <Line
                  data={{
                    labels:
                      predictWeatherData[track]?.list.map(
                        (entry) => entry.timestamp.split(" ")[1]
                      ) || [],
                    datasets: [
                      {
                        label: "Wind Speed",
                        data:
                          predictWeatherData[track]?.list.map(
                            (entry) => entry.wind.speed
                          ) || [],
                        borderColor: "rgba(75, 192, 192, 1)",
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                        borderWidth: 2, // Thickness of the line
                        pointBackgroundColor: "rgba(75, 192, 192, 1)",
                        pointBorderColor: "#fff",
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        fill: true,
                        tension: 0.4,
                      },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false, // Allow independent width & height control
                    scales: {
                      x: {
                        ticks: {
                          color: "white", // make the label text white
                        },
                      },
                      y: {
                        ticks: {
                          color: "white",
                        },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Weather Map */}
            <div className="col-span-6">
              <WeatherMap track={track} />
            </div>

            {/* Temperature */}
            <div className="col-span-12">
              <h2 className="text-lg font-semibold bg-emerald-950 px-4 py-2 rounded">
                Temperature for Selected Track
              </h2>
              <div className=" overflow-x-auto bg-gray-800 rounded-[10px] mt-4  p-4 ">
                <div className="">
                  <Line
                    data={{
                      labels:
                        predictWeatherData[track]?.list.map(
                          (entry) => entry.timestamp.split(" ")[1]
                        ) || [],
                      datasets: [
                        {
                          label: "Temperature",
                          data:
                            predictWeatherData[track]?.list.map(
                              (entry) => entry.temperature.current
                            ) || [],
                          borderColor: "rgba(75, 192, 192, 1)",
                          backgroundColor: "rgba(75, 192, 192, 0.2)",
                          borderWidth: 2, // Thickness of the line
                          pointBackgroundColor: "rgba(75, 192, 192, 1)",
                          pointBorderColor: "#fff",
                          pointRadius: 5,
                          pointHoverRadius: 7,
                          fill: true,
                          tension: 0.4,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false, // Allow independent width & height control
                      scales: {
                        x: {
                          ticks: {
                            color: "white", // make the label text white
                          },
                        },
                        y: {
                          ticks: {
                            color: "white",
                          },
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectLocation;
