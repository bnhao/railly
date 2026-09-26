import re

def clean_file(filepath, is_admin):
    with open(filepath, 'r') as f:
        content = f.read()

    if 'import { MapPin } from "lucide-react";' not in content:
        content = content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport { MapPin, Edit2, Trash2 } from "lucide-react";')

    content = content.replace('className="bg-black text-white h-screen p-10 overflow-hidden"', 'className="bg-[#121418] text-gray-200 min-h-screen p-8 overflow-hidden"')
    content = content.replace('className="bg-gray-800 p-6 rounded-md mb-6 shadow-md w-full max-w-[400px] h-[350px]"', 'className="bg-[#1e2128] p-6 rounded-xl mb-6 shadow-lg shadow-black/20 w-full max-w-[400px] h-auto border border-gray-800/50"')
    
    content = content.replace('className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"', 'className="w-full p-2.5 rounded-lg bg-[#181a20] text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors"')
    content = content.replace('className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-200"', 'className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 shadow-lg shadow-cyan-500/20"')
    content = content.replace('className="bg-gray-800 p-5 rounded-md overflow-x-auto shadow-md max-h-[85vh]"', 'className="bg-[#1e2128] rounded-xl overflow-x-auto shadow-lg shadow-black/20 border border-gray-800/50 max-h-[85vh]"')

    new_table = """<table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-[#181a20] text-xs uppercase text-gray-500 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 font-medium border-b border-gray-800">Task ID</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-800">Track ID</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-800">Title & Details</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-800">Assigned To</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-800">Schedule</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-800">Status</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-800 text-center">Map</th>"""
    if is_admin:
        new_table += """
                      <th className="px-6 py-4 font-medium border-b border-gray-800 text-right">Actions</th>"""
                      
    new_table += """
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-300">{task.id}</td>
                        <td className="px-6 py-4 font-mono text-cyan-400">#{task.track_id}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-200">{task.title}</div>
                          <div className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">{task.description}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{task.assigned_to}</td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs">{task.start_date} to {task.end_date}</div>
                          <div className="font-mono text-xs text-gray-500">{task.start_time} - {task.end_time}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            task.status.toLowerCase() === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            task.status.toLowerCase() === 'in progress' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {task.coordinates ? (
                            <a href={`/trackOverview?track=${task.track_id}`} className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded transition-colors" title="View on Map">
                              <MapPin size={18} />
                            </a>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>"""
                        
    if is_admin:
        new_table += """
                        <td className="px-6 py-4 flex justify-end gap-3 h-full items-center">
                          <Link
                            href={`/task/${task.id}`}
                            className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded transition-colors"
                            title="Edit Task"
                          >
                            <Edit2 size={18} />
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>"""
    new_table += """
                      </tr>
                    ))}
                  </tbody>
                </table>"""

    content = re.sub(r'<table.*?</table\s*>', new_table, content, flags=re.DOTALL)

    with open(filepath, 'w') as f:
        f.write(content)

try:
    clean_file('src/app/schedule/admin/page.tsx', True)
    clean_file('src/app/schedule/user/page.tsx', False)
except Exception as e:
    print(e)
