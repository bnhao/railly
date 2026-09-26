import re

def update_file(filepath, is_admin):
    with open(filepath, 'r') as f:
        content = f.read()

    # Add lucide-react imports
    if 'lucide-react' not in content:
        content = content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport { Trash2, Edit2 } from "lucide-react";')

    # Update background and grid styling
    content = content.replace('className="px-5 bg-background text-foreground w-full h-screen flex flex-col"', 'className="px-6 py-6 bg-[#121418] text-gray-200 w-full min-h-screen flex flex-col"')
    content = content.replace('className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 gap-5 h-full"', 'className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 gap-6 h-full"')

    # Update cards
    content = content.replace('bg-[#393A3E]', 'bg-[#1e2128] shadow-lg shadow-black/20 rounded-xl')
    
    # Update table
    old_table = """              <table className="border-collapse border border-gray-800 w-full">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Track</th>
                    <th>Priority</th>
                    <th>Assigned To</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.id}</td>
                      <td>{task.track_id}</td>
                      <td>{task.priority}</td>
                      <td>{task.assigned_to}</td>
                      <td>{task.status}</td>"""
                      
    if is_admin:
        old_table += """
                      <td>
                        <button
                          className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                        >
                          Delete
                        </button>
                        <button>
                          <Link
                            href={`/task/${task.id}`}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                          >
                            Edit
                          </Link>
                        </button>
                      </td>"""
    old_table += """
                    </tr>
                  ))}
                </tbody>
              </table>"""

    new_table = """              <div className="w-full overflow-hidden rounded-lg border border-gray-800/50">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-[#181a20] text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Order #</th>
                      <th className="px-6 py-4 font-medium">Track</th>
                      <th className="px-6 py-4 font-medium">Priority</th>
                      <th className="px-6 py-4 font-medium">Assigned To</th>
                      <th className="px-6 py-4 font-medium">Progress</th>"""
                      
    if is_admin:
        new_table += """
                      <th className="px-6 py-4 font-medium text-right">Actions</th>"""
                      
    new_table += """
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50 bg-[#1e2128]">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-300">{task.id}</td>
                        <td className="px-6 py-4 font-mono text-cyan-400">#{task.track_id}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            task.priority.toLowerCase() === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            task.priority.toLowerCase() === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{task.assigned_to}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            task.status.toLowerCase() === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            task.status.toLowerCase() === 'in progress' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {task.status}
                          </span>
                        </td>"""
                        
    if is_admin:
        new_table += """
                        <td className="px-6 py-4 flex justify-end gap-3">
                          <Link
                            href={`/task/${task.id}`}
                            className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded transition-colors"
                            title="Edit Task"
                          >
                            <Edit2 size={16} />
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>"""
    new_table += """
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>"""

    content = content.replace(old_table, new_table)
    
    # Fix the schedules card layout
    content = content.replace('<div\n              className="lg:col-span-1 lg:row-span-1 flex flex-col space-y-3 h-full rounded-md p-2 bg-[#1e2128] shadow-lg shadow-black/20 rounded-xl flex-grow hover:cursor-pointer "', '<div\n              className="lg:col-span-1 lg:row-span-1 flex flex-col space-y-4 h-full rounded-xl p-6 bg-[#1e2128] shadow-lg shadow-black/20 flex-grow hover:cursor-pointer"')
    content = content.replace('<h3 className="text-center text-lg font-bold">Schedules</h3>', '<div className="flex items-center justify-between mb-2"><h3 className="text-lg font-semibold text-gray-100">Active Schedules</h3></div>')
    
    # Map rounding
    content = content.replace('bg-[#393A3E] rounded-md', 'bg-[#1e2128] shadow-lg shadow-black/20 rounded-xl')

    # Remove the hover popup descriptions which are annoying
    content = re.sub(r'\{hoveredContainer === ".*?".*?</div>\n\s*\}', '', content, flags=re.DOTALL)
    content = content.replace('onMouseEnter={() => setHoveredContainer("weather")}\n              onMouseLeave={() => setHoveredContainer(null)}', '')
    content = content.replace('onMouseEnter={() => setHoveredContainer("capacity")}\n              onMouseLeave={() => setHoveredContainer(null)}', '')
    content = content.replace('onMouseEnter={() => setHoveredContainer("schedules")}\n              onMouseLeave={() => setHoveredContainer(null)}', '')

    with open(filepath, 'w') as f:
        f.write(content)

update_file('src/components/dashboard/AdminDashboardClient.tsx', True)
update_file('src/components/dashboard/UserDashboardClient.tsx', False)
