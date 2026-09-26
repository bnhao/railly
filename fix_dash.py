import re

def fix_dash(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Fix TrackCapacityChart wrapper
    content = content.replace(
        'className="lg:col-span-1 lg:row-span-1 flex flex-col space-y-3 h-full rounded-md pb-12 pt-2 pr-2 pl-2 bg-[#1e2128] shadow-lg shadow-black/20 rounded-xl flex-grow hover:cursor-pointer"',
        'className="lg:col-span-1 lg:row-span-1 flex flex-col space-y-4 h-full min-h-[300px] p-6 bg-[#1e2128] shadow-lg shadow-black/20 rounded-xl flex-grow hover:cursor-pointer overflow-hidden"'
    )
    
    # Also fix WeatherWidget wrapper to match
    content = content.replace(
        'className="lg:col-span-1 lg:row-span-1 flex flex-col space-y-3 h-full rounded-md p-2 bg-[#1e2128] shadow-lg shadow-black/20 rounded-xl flex-grow hover:cursor-pointer items-center justify-center overflow-hidden"',
        'className="lg:col-span-1 lg:row-span-1 flex flex-col h-full min-h-[300px] bg-[#1e2128] shadow-lg shadow-black/20 rounded-xl flex-grow hover:cursor-pointer overflow-hidden"'
    )

    # Schedules wrapper fix
    content = content.replace(
        'className="lg:col-span-1 lg:row-span-1 flex flex-col space-y-4 h-full rounded-xl p-6 bg-[#1e2128] shadow-lg shadow-black/20 flex-grow hover:cursor-pointer"',
        'className="lg:col-span-1 lg:row-span-1 flex flex-col space-y-4 h-full min-h-[300px] rounded-xl p-6 bg-[#1e2128] shadow-lg shadow-black/20 flex-grow hover:cursor-pointer overflow-hidden"'
    )

    with open(filepath, 'w') as f:
        f.write(content)

fix_dash('src/components/dashboard/AdminDashboardClient.tsx')
fix_dash('src/components/dashboard/UserDashboardClient.tsx')
