import re

with open("src/components/railwayMap.tsx", "r") as f:
    content = f.read()

# Add the wrapper class
content = content.replace(
    '<div\n      onMouseEnter={() => setIsHovered(true)}',
    '<div\n      className="lg:col-span-1 lg:row-span-1 relative flex flex-col h-full min-h-0 bg-[#1e2128] shadow-lg shadow-black/20 rounded-xl flex-grow hover:cursor-pointer overflow-hidden"\n      onMouseEnter={() => setIsHovered(true)}'
)

# Fix the map border radius to match the modern theme (12px = rounded-xl)
content = content.replace('borderRadius: "6px"', 'borderRadius: "12px"')

with open("src/components/railwayMap.tsx", "w") as f:
    f.write(content)
