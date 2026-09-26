with open("src/components/weather/SelectLocation.tsx", "r") as f:
    content = f.read()

import re

# Fix broken options blocks
content = re.sub(r'options=\{\{.*?maintainAspectRatio: false,.*?\}\}', '''options={{
                      maintainAspectRatio: false,
                      scales: {
                        x: { grid: { display: false, drawBorder: false }, ticks: { color: "#6b7280" } },
                        y: { grid: { color: "rgba(255, 255, 255, 0.05)", drawBorder: false }, ticks: { color: "#6b7280" }, beginAtZero: true }
                      },
                      plugins: { legend: { display: false } }
                    }}''', content, flags=re.DOTALL)

with open("src/components/weather/SelectLocation.tsx", "w") as f:
    f.write(content)
