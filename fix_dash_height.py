import re

def fix_dash(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Main container: min-h-screen -> h-screen overflow-hidden
    content = content.replace(
        'className="px-6 py-6 bg-[#121418] text-gray-200 w-full min-h-screen flex flex-col"',
        'className="px-6 py-6 bg-[#121418] text-gray-200 w-full h-screen overflow-hidden flex flex-col"'
    )

    # 2. Grid widget sizing: remove min-h-[300px] and add min-h-0
    content = content.replace('min-h-[300px]', 'min-h-0')

    # 3. Schedule Table container: make it scrollable internally
    content = content.replace(
        '<div className="w-full overflow-hidden rounded-lg border border-gray-800/50">',
        '<div className="w-full overflow-y-auto rounded-lg border border-gray-800/50 flex-1 min-h-0 relative">'
    )
    
    # 4. Table header sticky so it stays visible while scrolling
    content = content.replace(
        '<thead className="bg-[#181a20] text-xs uppercase text-gray-500">',
        '<thead className="bg-[#181a20] text-xs uppercase text-gray-500 sticky top-0 z-10">'
    )

    with open(filepath, 'w') as f:
        f.write(content)

fix_dash('src/components/dashboard/AdminDashboardClient.tsx')
fix_dash('src/components/dashboard/UserDashboardClient.tsx')
