import sys

with open("src/components/weather/SelectLocation.tsx", "r") as f:
    lines = f.readlines()

out = []
skip = False
for i, line in enumerate(lines):
    if i == 72: # line 73 (0-indexed 72)
        out.append("""  useEffect(() => {
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
""")
        skip = True
    elif i == 119: # line 120 (0-indexed 119)
        skip = False
    
    if not skip and i != 72 and i >= 119:
        out.append(line)
    elif not skip and i < 72:
        out.append(line)

with open("src/components/weather/SelectLocation.tsx", "w") as f:
    f.writelines(out)
