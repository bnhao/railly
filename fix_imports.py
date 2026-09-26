import re

def add_imports(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    new_imports = 'import Link from "next/link";\nimport { MapPin, Edit2, Trash2 } from "lucide-react";\n'
    content = new_imports + content

    with open(filepath, 'w') as f:
        f.write(content)

add_imports('src/app/schedule/admin/page.tsx')
add_imports('src/app/schedule/user/page.tsx')
