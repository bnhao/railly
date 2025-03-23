const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const GTFS_FOLDER = "./viarail"; // Path to your GTFS files
const OUTPUT_FILE = "./track_capacity.json"; // Save output in Next.js public folder
const CAPACITY_REFERENCE = 80; // 80 trains per track per day = 100% capacity

// Load a CSV file into an array of objects
const loadCSV = (filename) =>
  new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(path.join(GTFS_FOLDER, filename))
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });

async function processGTFS() {
  try {
    console.log("📂 Loading GTFS data...");
    const stopTimes = await loadCSV("stop_times.txt");
    const trips = await loadCSV("trips.txt");
    const routes = await loadCSV("routes.txt");

    console.log("🚆 Counting train frequencies...");

    const trackUsage = {}; // Store train count per track segment

    // Map trip_id -> route_id
    const tripRouteMap = {};
    trips.forEach((trip) => {
      tripRouteMap[trip.trip_id] = trip.route_id;
    });

    // Count trips per track segment
    stopTimes.forEach((entry) => {
      const { trip_id, stop_id } = entry;
      const route_id = tripRouteMap[trip_id] || "unknown";

      // Define a track segment key (simple example: stop_id)
      const segmentKey = `${route_id}_${stop_id}`;

      trackUsage[segmentKey] = (trackUsage[segmentKey] || 0) + 1;
    });

    // Normalize to 100% capacity
    const trackCapacity = Object.entries(trackUsage).map(([segment, count]) => ({
      track_id: segment,
      train_count: count,
      capacity: Math.min((count / CAPACITY_REFERENCE) * 100, 100), // Cap at 100%
    }));

    // Save output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(trackCapacity, null, 2));
    console.log(`✅ Track capacity data saved to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("❌ Error processing GTFS data:", error);
  }
}

// Run the script
processGTFS();
