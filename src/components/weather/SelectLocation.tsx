import { ChangeEvent, JSX, useEffect, useState } from "react";
import { forecastType } from "@/app/types";
import { Chart as ChartJs, defaults, CategoryScale } from "chart.js/auto";
import { Line } from "react-chartjs-2";
import { Task } from "@/app/schedule/page";

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

const SelectLocation = ({ handleTrackChange, track, predictWeatherData }: Props): JSX.Element => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [forecastData, setForecastData] = useState<{ [key: string]: forecastType | null }>({});
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
            const cleaned = coordinates.replace(/{{|}}/g, "").replace(/\\/g, "").replace(/"/g, "");
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

    // // Update Meteoblue map and fetch weather when track changes
    // useEffect(() => {
    //     const selectedTask = tasks.find((task) => task.track_id === track);
    //     if (selectedTask?.coordinates) {
    //         const coordinates = parseCoordinates(selectedTask.coordinates);
    //         if (coordinates) {
    //             const [lat, lon] = coordinates;
    //             setMapUrl(
    //                 `https://www.meteoblue.com/en/weather/maps/widget?lat=${lat}&lon=${lon}&zoom=8&tempunit=C&windunit=km/h&lengthunit=metric`
    //             );

    //             // Fetch weather data
    //             fetchWeather(lat, lon).then((data) => {
    //                 setForecastData((prev) => ({
    //                     ...prev,
    //                     [track]: data, // Store weather data by track ID
    //                 }));
    //             });
    //         }
    //     }
    // }, [track, tasks]);
    useEffect(() => {
        const fetchAllForecasts = async () => {
            if (tasks.length > 0) {
                const updatedForecastData: { [key: string]: forecastType | null } = {};

                for (const task of tasks) {
                    if (task.coordinates) {
                        const coordinates = parseCoordinates(task.coordinates);
                        if (coordinates) {
                            const [lat, lon] = coordinates;
                            setMapUrl(
                                `https://www.meteoblue.com/en/weather/maps/widget?lat=${lat}&lon=${lon}&zoom=8&tempunit=C&windunit=km/h&lengthunit=metric`
                            );
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

    const selectedForecast = forecastData[track];

    return (
        <div className="bg-black text-white min-h-screen mt-zero p-3">
            <div className="grid grid-cols-12 gap-6">
                {/* Current forecast per track */}
                <div className="col-span-4 space-y-4">
                    <div className="bg-emerald-950 p-4 rounded">
                        <h2 className="text-lg font-semibold">Current Forecast Per Track</h2>
                    </div>

                    {tasks.map((task, i) => {
                        const forecast = forecastData[task.track_id];
                        return (
                            <div key={i} className="bg-gray-800 p-4 rounded-[10px]"
                                onClick={() => {
                                    const event = new Event("change", { bubbles: true }) as unknown as ChangeEvent<HTMLSelectElement>;
                                    Object.defineProperty(event, "target", {
                                        writable: false,
                                        value: { value: task.track_id } as EventTarget & HTMLSelectElement,
                                    });
                                    handleTrackChange(event);
                                }}
                            >
                                <h3 className="font-bold">
                                    {`Track ${i + 1} - ${task.track_id} (${forecast?.list?.[0]?.weather?.[0]?.main ?? "-"})`}
                                </h3>
                                <p>Wind Speed: {forecast?.list?.[0]?.wind?.speed ?? "-"} km/h</p>
                                <p>Temperature: {forecast?.list?.[0]?.main?.temp ?? "-"}°C</p>
                                <p>Feels Like: {forecast?.list?.[0]?.main?.feels_like ?? "-"}°C</p>
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
                            {tasks.map((task) => (
                                <option key={task.track_id} value={task.track_id}>
                                    {`Track ${task.track_id}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="grid grid-cols-12 gap-6">
                        {/* Wind Direction for Selected Track */}
                        <div className="col-span-6">
                            <h2 className="text-lg font-semibold bg-emerald-950 px-4 py-2 rounded ">
                                Wind Direction for Selected Track
                            </h2>
                            <div className="font-bold text-5xl h-40 bg-gray-800 rounded-[10px] mt-4 flex items-center justify-center">
                                {selectedForecast?.list?.[0]?.wind?.deg !== undefined
                                    ? `${getWindDirection(Math.round(selectedForecast.list[0].wind.deg))}`
                                    : 'No data'}
                            </div>
                            <h2 className="text-lg font-semibold bg-emerald-950 px-4 py-2 rounded mt-4">
                                Wind Speed for Selected Track
                            </h2>
                            <div className="h-[200px] bg-gray-800 rounded-[10px] p-3 mt-4 flex items-center justify-center">
                                {selectedForecast ? (
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
                                                    data: selectedForecast.list.map((entry) => entry.wind.speed),
                                                    borderColor: "rgba(75, 192, 192, 1)",
                                                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                                                    borderWidth: 2,
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
                                            maintainAspectRatio: false,
                                            scales: {
                                                x: {
                                                    ticks: {
                                                        color: "white",
                                                    },
                                                },
                                                y: {
                                                    ticks: {
                                                        color: "white",
                                                    },
                                                    beginAtZero: false,
                                                },
                                            },
                                        }}
                                    />
                                ) : (
                                    <p className="text-gray-500">No wind speed data available for the selected track.</p>
                                )}
                            </div>
                        </div>
                        {/* Meteoblue Weather Map */}
                        <div className="col-span-6">
                            <h2 className="text-lg font-semibold bg-emerald-950 px-4 py-2 rounded">
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
                            <h2 className="text-lg font-semibold bg-emerald-950 px-4 py-2 rounded">
                                Temperature for Selected Track
                            </h2>
                            <div className="overflow-x-auto bg-gray-800 rounded-[10px] mt-4 p-4">
                                <Line
                                    data={{
                                        labels: selectedForecast?.list.map((entry) =>
                                            new Date(entry.dt * 1000).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })
                                        ) || [],
                                        datasets: [
                                            {
                                                label: "Temperature",
                                                data: selectedForecast?.list.map(
                                                    (entry) => entry.main.temp
                                                ) || [],
                                                borderColor: "rgba(75, 192, 192, 1)",
                                                backgroundColor: "rgba(75, 192, 192, 0.2)",
                                                borderWidth: 2,
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
                                        maintainAspectRatio: false,
                                        scales: {
                                            x: { ticks: { color: "white" } },
                                            y: { ticks: { color: "white" }, beginAtZero: true },
                                        },
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
