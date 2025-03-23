const fs = require("fs");
const csv = require("csv-parser");

// Load GTFS files
const shapesFile = "../data/viarail/shapes.txt";
const tripsFile = "../data/viarail/trips.txt";

// Data storage
const shapes = {};
const trackUsage = {};

// Read shapes.txt (convert to GeoJSON)
fs.createReadStream(shapesFile)
  .pipe(csv())
  .on("data", (row) => {
    const { shape_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence } = row;

    if (!shapes[shape_id]) {
      shapes[shape_id] = { type: "Feature", properties: { shape_id }, geometry: { type: "LineString", coordinates: [] } };
    }

    shapes[shape_id].geometry.coordinates.push([
      parseFloat(shape_pt_lon),
      parseFloat(shape_pt_lat),
    ]);
  })
  .on("end", () => {
    console.log("✅ Shapes processed");

    // Read trips.txt (count trips per shape_id)
    fs.createReadStream(tripsFile)
      .pipe(csv())
      .on("data", (row) => {
        const shape_id = row.shape_id;
        trackUsage[shape_id] = (trackUsage[shape_id] || 0) + 1;
      })
      .on("end", () => {
        console.log("✅ Trips counted");

        // Merge trip counts into GeoJSON
        Object.keys(shapes).forEach((shape_id) => {
          shapes[shape_id].properties.trip_count = trackUsage[shape_id] || 0;
        });

        // Convert to GeoJSON
        const geojson = {
          type: "FeatureCollection",
          features: Object.values(shapes),
        };

        // Save to file
        fs.writeFileSync("tracks_with_capacity.geojson", JSON.stringify(geojson, null, 2));
        console.log("✅ GeoJSON saved as tracks_with_capacity.geojson");
      });
  });
