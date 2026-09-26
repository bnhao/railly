export const CHART_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const CHART_BACKGROUND_COLORS = [
  "rgba(6, 182, 212, 0.2)" // Cyan transparent
];

export const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  elements: {
    line: {
      tension: 0.4, // Smooth curves
      borderWidth: 2,
      borderColor: "#06b6d4", // Cyan
      fill: true,
      backgroundColor: "rgba(6, 182, 212, 0.1)", // Under line gradient simulation
    },
    point: {
      radius: 0, // Hide points until hover
      hitRadius: 10,
      hoverRadius: 4,
      backgroundColor: "#06b6d4",
    }
  },
  scales: {
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: "#6b7280", // Gray-500
        font: {
          family: "'Geist', sans-serif",
          size: 11
        }
      }
    },
    y: {
      grid: {
        color: "rgba(255, 255, 255, 0.05)", // Very subtle grid
        drawBorder: false,
      },
      ticks: {
        color: "#6b7280",
        font: {
          family: "'Geist', sans-serif",
          size: 11
        }
      }
    }
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: "rgba(17, 24, 39, 0.9)", // Gray-900
      titleColor: "#f3f4f6", // Gray-100
      bodyColor: "#d1d5db", // Gray-300
      padding: 12,
      cornerRadius: 8,
      borderColor: "rgba(255,255,255,0.1)",
      borderWidth: 1
    }
  }
};
  