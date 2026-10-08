export async function fetchRailwayData(query = "", limit = 5) {
    const resourceId = "15eeafa2-c331-44e7-b37f-d0d54a51d2eb"; // Resource ID for the railway dataset
    const url = `https://open.canada.ca/data/en/api/3/action/datastore_search?resource_id=${resourceId}&limit=${limit}&q=${query}`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.result.records;
    } catch (error) {
      console.error("Error fetching railway data:", error);
      return [];
    }
  }
  