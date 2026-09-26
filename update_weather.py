import re

with open("src/components/weather/SelectLocation.tsx", "r") as f:
    content = f.read()

# Update background and layout
content = content.replace('className="bg-black text-white min-h-screen"', 'className="bg-[#121418] text-gray-200 min-h-screen p-6"')
content = content.replace('className="grid grid-cols-12 gap-5"', 'className="grid grid-cols-1 lg:grid-cols-12 gap-6"')

# Left Sidebar (Current Forecast)
content = content.replace('className="bg-emerald-950 p-4 rounded"', 'className="bg-[#1e2128] p-5 rounded-xl shadow-lg shadow-black/20 mb-4 border border-gray-800/50"')
content = content.replace('className="text-lg font-semibold"', 'className="text-lg font-semibold text-gray-100"')
content = content.replace('className="bg-gray-800 p-4 rounded-[10px]"', 'className="bg-[#1e2128] p-5 rounded-xl border border-gray-800/50 cursor-pointer hover:bg-gray-800/60 transition-colors"')
content = content.replace('className="font-bold"', 'className="font-bold text-cyan-400 mb-2"')

# Dropdown / Select
content = content.replace('className="bg-gray-800 text-white border p-0.5 rounded cursor-pointer hover:bg-gray-700 transition"', 'className="bg-[#181a20] text-gray-200 border border-gray-700 p-2 rounded-lg cursor-pointer hover:border-cyan-500/50 transition outline-none focus:border-cyan-500"')

# Right Sidebar Panels
content = content.replace('className="flex justify-between items-center bg-emerald-950 p-4 rounded"', 'className="flex justify-between items-center bg-[#1e2128] p-5 rounded-xl shadow-lg shadow-black/20 border border-gray-800/50"')
content = content.replace('className="text-lg font-semibold bg-emerald-950 px-4 py-2 rounded "', 'className="text-lg font-semibold bg-[#1e2128] px-5 py-4 rounded-xl shadow-lg shadow-black/20 border border-gray-800/50"')
content = content.replace('className="text-lg font-semibold bg-emerald-950 px-4 py-2 rounded mt-4"', 'className="text-lg font-semibold bg-[#1e2128] px-5 py-4 rounded-xl shadow-lg shadow-black/20 border border-gray-800/50 mt-6"')
content = content.replace('className="text-lg font-semibold bg-emerald-950 px-4 py-2 rounded"', 'className="text-lg font-semibold bg-[#1e2128] px-5 py-4 rounded-xl shadow-lg shadow-black/20 border border-gray-800/50"')

# Wind blocks
content = content.replace('className="font-bold text-5xl h-40 bg-gray-800 rounded-[10px] mt-4 flex items-center justify-center"', 'className="font-bold text-6xl h-32 bg-[#1e2128] rounded-xl mt-4 flex items-center justify-center text-cyan-400 border border-gray-800/50 shadow-lg shadow-black/20"')
content = content.replace('className="h-[200px] bg-gray-800 rounded-[10px] p-3 mt-4 flex items-center justify-center"', 'className="h-[240px] bg-[#1e2128] rounded-xl p-4 mt-4 flex items-center justify-center border border-gray-800/50 shadow-lg shadow-black/20"')
content = content.replace('className="overflow-x-auto bg-gray-800 rounded-[10px] mt-4 p-4"', 'className="h-[300px] bg-[#1e2128] rounded-xl mt-4 p-4 border border-gray-800/50 shadow-lg shadow-black/20"')

# Chart tweaks for Industrial theme
content = content.replace('borderColor: "rgba(75, 192, 192, 1)"', 'borderColor: "#06b6d4", tension: 0.4')
content = content.replace('backgroundColor: "rgba(75, 192, 192, 0.2)"', 'backgroundColor: "rgba(6, 182, 212, 0.1)"')
content = content.replace('pointBackgroundColor: "rgba(75, 192, 192, 1)"', 'pointBackgroundColor: "#06b6d4", pointRadius: 0')
content = content.replace('pointBorderColor: "#fff"', 'pointBorderColor: "transparent"')

# Adjust chart axes
content = re.sub(r'scales: \{.*?\}', r'''scales: {
                      x: { grid: { display: false }, ticks: { color: "#6b7280" } },
                      y: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#6b7280" }, beginAtZero: true },
                    }''', content, flags=re.DOTALL)

with open("src/components/weather/SelectLocation.tsx", "w") as f:
    f.write(content)
