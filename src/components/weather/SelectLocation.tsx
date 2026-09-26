import { ChangeEvent, JSX, useEffect, useState } from "react";
import { forecastType } from "@/app/types";
import { Chart as ChartJs, defaults, CategoryScale } from "chart.js/auto";
import { Line } from "react-chartjs-2";
import { Task } from "@/app/schedule/user/page";

ChartJs.register(CategoryScale);

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY; // Replace with your actual key

type Props = {
  track: string;
  forecastData: { [key: string]: forecastType | null };
  handleTrackChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  predictWeatherData: { [key: string]: any };
};

const getWindDirection = (degree: number): string => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degree / 45) % 8;
  return directions[index];
};

const SelectLocation = ({
  handleTrackChange,
  track,
  predictWeatherData,
}: Props): JSX.Element => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [forecastData, setForecastData] = useState<{
    [key: string]: forecastType | null;
  }>({});
  const [mapUrl, setMapUrl] = useState<string>("");

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      const tasks = await fetch("/api/tasks").then((res) => res.json());
      setTasks(tasks);
    };
    fetchTasks();
  }, []);

  // Parse coordinates from task
  const parseCoordinates = (coordinates: string): [number, number] | null => {
    try {
      const cleaned = coordinates
        .replace(/{{|}}/g, "")
        .replace(/\\/g, "")
        .replace(/"/g, "");
      const [lon, lat] = cleaned.split(",");
      return [parseFloat(lat.trim()), parseFloat(lon.trim())];
    } catch (error) {
      console.error("Error parsing coordinates:", error);
      return null;
    }
  };

  // Fetch weather data
  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error fetching weather data:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchAllForecasts = async () => {
      if (tasks.length > 0) {
        const updatedForecastData: { [key: string]: any | null } = {};

        for (const task of tasks) {
          if (task.coordinates) {
            const coordinates = parseCoordinates(task.coordinates as unknown as string);
            if (coordinates) {
              const [lat, lon] = coordinates;
              const data = await fetchWeather(lat, lon);
              updatedForecastData[task.track_id] = data;
            }
          }
        }
        setForecastData(updatedForecastData);
      }
    };
    fetchAllForecasts();
  }, [tasks]);

  // Update mapUrl when track changes
  useEffect(() => {
    const selectedTask = tasks.find((t) => String(t.track_id) === String(track));
    if (selectedTask?.coordinates) {
      const coordinates = parseCoordinates(selectedTask.coordinates as unknown as string);
      if (coordinates) {
        const [lat, lon] = coordinates;
        setMapUrl(
          `https://www.meteoblue.com/en/weather/maps/widget?lat=${lat}&lon=${lon}&zoom=8&tempunit=C&windunit=km/h&lengthunit=metric`
        );
      }
    } else {
      setMapUrl("");
    }
  }, [track, tasks]);

  const selectedForecast = forecastData[track];

  return (
    <div className="bg-[#121418] text-gray-200 min-h-screen p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Current forecast per track */}
        <div className="col-span-4 space-y-4">
          <div className="bg-[#1e2128] p-5 rounded-xl shadow-lg shadow-black/20 mb-4 border border-gray-800/50">
            <h2 className="text-lg font-semibold text-gray-100">
              Current Forecast Per Track
            </h2>
          </div>

          {tasks.map((task, i) => {
            const forecast = forecastData[task.track_id];
            return (
              <div
                key={i}
                className="bg-[#1e2128] p-5 rounded-xl border border-gray-800/50 cursor-pointer hover:bg-gray-800/60 transition-colors"
                onClick={() => {
                  const event = new Event("change", {
                    bubbles: true,
                  }) as unknown as ChangeEvent<HTMLSelectElement>;
                  Object.defineProperty(event, "target", {
                    writable: false,
                    value: { value: task.track_id } as EventTarget &
                      HTMLSelectElement,
                  });
                  handleTrackChange(event);
                }}
              >
                <h3 className="font-bold text-cyan-400 mb-2">
                  {`Track ${i + 1} - ${task.track_id} (${
                    (forecast as any)?.list?.[0]?.weather?.[0]?.main ?? "-"
                  })`}
                </h3>
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
          <div className="flex justify-between items-center bg-[#1e2128] p-5 rounded-xl shadow-lg shadow-black/20 border border-gray-800/50">
            <h2 className="text-lg font-semibold text-gray-100">Select a Track</h2>
            <select
              name="track"
              id="track"
              className="bg-[#181a20] text-gray-200 border border-gray-700 p-2 rounded-lg cursor-pointer hover:border-cyan-500/50 transition outline-none focus:border-cyan-500"
              value={track}
              onChange={handleTrackChange}
            >
              <option value="">Select a Track</option>
              {tasks.map((task, index) => (
                <option key={`${task.track_id}-${index}`} value={task.track_id}>
                  {`Track ${task.track_id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Wind Direction for Selected Track */}
            <div className="col-span-6">
              <h2 className="text-lg font-semibold bg-[#1e2128] px-5 py-4 rounded-xl shadow-lg shadow-black/20 border border-gray-800/50">
                Wind Direction for Selected Track
              </h2>
              <div className="font-bold text-6xl h-32 bg-[#1e2128] rounded-xl mt-4 flex items-center justify-center text-cyan-400 border border-gray-800/50 shadow-lg shadow-black/20">
                {selectedForecast?.list?.[0]?.wind?.deg !== undefined
                  ? `${getWindDirection(
                      Math.round(selectedForecast.list[0].wind.deg)
                    )}`
                  : "No data"}
              </div>
              <h2 className="text-lg font-semibold bg-[#1e2128] px-5 py-4 rounded-xl shadow-lg shadow-black/20 border border-gray-800/50 mt-6">
                Wind Speed for Selected Track
              </h2>
              <div className="relative h-[240px] w-full bg-[#1e2128] rounded-xl p-4 mt-4 flex items-center justify-center border border-gray-800/50 shadow-lg shadow-black/20">
                {selectedForecast && Array.isArray(selectedForecast.list) ? (
                  <Line
                    data={{
                      labels: selectedForecast.list.map((entry) =>
                        new Date(entry.dt * 1000).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ),
                      datasets: [
                        {
                          label: "Wind Speed",
                          data: selectedForecast.list.map(
                            (entry) => entry.wind?.speed ?? 0
                          ),
                          backgroundColor: "rgba(6, 182, 212, 0.1)",
                          borderWidth: 2,
                          pointBackgroundColor: "#06b6d4", pointRadius: 0,
                          pointBorderColor: "transparent",
                          pointHoverRadius: 7,
                          fill: true,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        x: { grid: { display: false, drawTicks: false }, ticks: { color: "#6b7280" } },
                        y: { grid: { color: "rgba(255, 255, 255, 0.05)", drawTicks: false }, ticks: { color: "#6b7280" }, beginAtZero: true }
                      },
                      plugins: { legend: { display: false } }
                    }}
                  />
                ) : (
                  <p className="text-gray-500">
                    No wind speed data available for the selected track.
                  </p>
                )}
              </div>
            </div>
            {/* Meteoblue Weather Map */}
            <div className="col-span-6">
              <h2 className="text-lg font-semibold bg-[#1e2128] px-5 py-4 rounded-xl shadow-lg shadow-black/20 border border-gray-800/50">
                Meteoblue Weather Map for Selected Track
              </h2>
              <div className="mt-4">
                {mapUrl ? (
                  <iframe
                    src={mapUrl}
                    frameBorder="0"
                    scrolling="no"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
                    style={{
                      width: "100%",
                      height: "420px",
                      borderRadius: "10px",
                    }}
                    title="Meteoblue Weather Map"
                  ></iframe>
                ) : (
                  <p className="text-gray-500 text-center">
                    No map available for the selected track.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Temperature Chart */}
            <div className="col-span-12">
              <h2 className="text-lg font-semibold bg-[#1e2128] px-5 py-4 rounded-xl shadow-lg shadow-black/20 border border-gray-800/50">
                Temperature for Selected Track
              </h2>
              <div className="relative h-[300px] w-full bg-[#1e2128] rounded-xl mt-4 p-4 border border-gray-800/50 shadow-lg shadow-black/20">
                <Line
                  data={{
                    labels:
                      selectedForecast?.list?.map((entry) =>
                        new Date(entry.dt * 1000).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ) || [],
                    datasets: [
                      {
                        label: "Temperature",
                        data:
                          selectedForecast?.list?.map(
                            (entry) => entry.main?.temp ?? 0
                          ) || [],
                        backgroundColor: "rgba(6, 182, 212, 0.1)",
                        borderWidth: 2,
                        pointBackgroundColor: "#06b6d4", pointRadius: 0,
                        pointBorderColor: "transparent",
                        pointHoverRadius: 7,
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                      maintainAspectRatio: false,
                      scales: {
                        x: { grid: { display: false, drawTicks: false }, ticks: { color: "#6b7280" } },
                        y: { grid: { color: "rgba(255, 255, 255, 0.05)", drawTicks: false }, ticks: { color: "#6b7280" }, beginAtZero: true }
                      },
                      plugins: { legend: { display: false } }
                    }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectLocation;
