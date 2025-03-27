// Setup track maintenance history
export const trackMaintenanceData = {
  "Track 1": [5, 8, 6, 10, 9, 7, 8, 6, 10, 12, 11, 9],
  "Track 2": [4, 7, 5, 9, 8, 6, 7, 5, 9, 11, 10, 8],
  "Track 3": [6, 9, 7, 11, 10, 8, 9, 7, 11, 13, 12, 10],
  "Track 4": [3, 6, 4, 8, 7, 5, 6, 4, 8, 10, 9, 7],
  "Track 5": [7, 10, 8, 12, 11, 9, 10, 8, 12, 14, 13, 11],
};

// Setup track details
export const trackDetails = {
  "Track 1": {
    name: "Main - Operational - Freight and Tourist",
    location: "Alberta, Laggan, Canadian Pacific",
    identifier: "0b345a08a0db4a3eb944443b259396cb",
    mode: "Train",
    subdivision1: "Laggan",
    subdivision2: "Calgary",
    length: "136.60 Mile",
  },
  "Track 2": {
    name: "Secondary - Operational - Passenger",
    location: "Ontario, Toronto, Canadian National",
    identifier: "0a234b06a1cb4b3fb945533b269396cc",
    mode: "Train",
    subdivision1: "Toronto",
    subdivision2: "Niagara",
    length: "120.45 Mile",
  },
  "Track 3": {
    name: "Light Rail - Urban Transport",
    location: "British Columbia, Vancouver, TransLink",
    identifier: "1c456d09c2dc5c4fc946623c379397cd",
    mode: "Light Rail",
    subdivision1: "Vancouver",
    subdivision2: "Richmond",
    length: "85.20 Mile",
  },
  "Track 4": {
    name: "Cargo - Industrial Use",
    location: "Quebec, Montreal, VIA Rail",
    identifier: "2d567e12d3ed6d5fd957713d489398de",
    mode: "Train",
    subdivision1: "Montreal",
    subdivision2: "Quebec City",
    length: "150.30 Mile",
  },
  "Track 5": {
    name: "High Speed Rail",
    location: "Ontario, Ottawa, Canadian National",
    identifier: "3e678f13e4fe7e6ge968823e599399ef",
    mode: "High Speed Train",
    subdivision1: "Ottawa",
    subdivision2: "Toronto",
    length: "200.00 Mile",
  },
};

// Setup Track Capacity
export const trackCapacityData = {
  labels: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  datasets: [
    {
      label: "Track 1",
      data: [200, 220, 210, 250, 240, 230, 260, 300, 320, 350, 370, 400],
      borderColor: "rgba(255, 99, 132, 1)",
      fill: false,
    },
    {
      label: "Track 2",
      data: [170, 190, 220, 230, 250, 240, 250, 260, 270, 320, 330, 370],
      borderColor: "rgba(54, 162, 235, 1)",
      fill: false,
    },
    {
      label: "Track 3",
      data: [130, 170, 180, 200, 210, 180, 190, 220, 270, 300, 320, 340],
      borderColor: "rgba(255, 206, 86, 1)",
      fill: false,
    },
    {
      label: "Track 4",
      data: [150, 150, 160, 180, 190, 200, 220, 230, 250, 270, 290, 310],
      borderColor: "rgba(75, 192, 192, 1)",
      fill: false,
    },
    {
      label: "Track 5",
      data: [150, 145, 150, 160, 170, 190, 210, 230, 240, 260, 280, 300],
      borderColor: "rgba(153, 102, 255, 1)",
      fill: false,
    },
  ],
};
