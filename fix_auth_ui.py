import re

def update_ui(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Layout & Background
    content = content.replace('bg-[#33313B]', 'bg-[#121418]')
    content = content.replace('bg-white dark:bg-gray-800 p-6 ronuded-lg shadow-md', 'bg-[#1e2128] border border-gray-800/50 p-8 rounded-2xl shadow-2xl shadow-black/40')
    content = content.replace('bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md', 'bg-[#1e2128] border border-gray-800/50 p-8 rounded-2xl shadow-2xl shadow-black/40')

    # Header
    content = content.replace('text-white', 'text-gray-100')
    content = content.replace('text-center text-lg font-bold mb-6 text-gray-100', 'text-center text-2xl font-bold mb-8 text-cyan-400 tracking-widest drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]')

    # Labels
    content = content.replace('text-gray-900 dark:text-gray-100', 'text-gray-300')
    content = content.replace('text-gray-900 dark:text-gray-300', 'text-gray-400')

    # Inputs
    old_input_class1 = 'w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100'
    old_input_class2 = 'w-full p-2.5 mb-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100'
    old_input_class3 = 'w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg'
    old_input_class4 = 'w-full p-2.5 mb-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg'
    
    new_input_class = 'w-full p-3 bg-[#181a20] border border-gray-700 text-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors'
    new_input_class_mb2 = 'w-full p-3 mb-2 bg-[#181a20] border border-gray-700 text-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors'

    content = content.replace(old_input_class1, new_input_class)
    content = content.replace(old_input_class2, new_input_class_mb2)
    content = content.replace(old_input_class3, new_input_class)
    content = content.replace(old_input_class4, new_input_class_mb2)
    
    # Checkbox
    content = content.replace('text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600', 'text-cyan-500 bg-[#181a20] border-gray-700 rounded focus:ring-cyan-500 focus:ring-offset-gray-800 focus:ring-1 cursor-pointer')

    # Button
    content = content.replace('bg-blue-600 hover:bg-blue-700 text-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 focus:ring-4 focus:ring-blue-300', 'w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-sm px-5 py-3.5 transition-colors duration-200 shadow-lg shadow-cyan-500/20 mt-4')
    content = content.replace('bg-blue-600 hover:bg-blue-700 text-gray-100 font-medium rounded-lg text-sm px-5 py-2.5', 'w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-sm px-5 py-3.5 transition-colors duration-200 shadow-lg shadow-cyan-500/20 mt-4')

    # Links
    content = content.replace('text-blue-400', 'text-cyan-400 hover:text-cyan-300 font-medium transition-colors')
    
    # Generic paragraph text
    content = content.replace('<p>', '<p className="text-gray-400">')
    content = content.replace('<p className="mr-1">', '<p className="mr-1 text-gray-400">')

    # Eye icon spacing
    content = content.replace('pb-2 cursor-pointer', 'pb-0 right-4 cursor-pointer opacity-50 hover:opacity-100 transition-opacity')

    with open(filepath, 'w') as f:
        f.write(content)

update_ui('src/app/logIn/page.tsx')
update_ui('src/app/signIn/page.tsx')
