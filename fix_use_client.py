def fix_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()

    # Find the index of "use client";
    use_client_idx = -1
    for i, line in enumerate(lines):
        if '"use client"' in line or "'use client'" in line:
            use_client_idx = i
            break

    if use_client_idx > 0: # If it exists and is not the first line
        # Extract it
        use_client_line = lines.pop(use_client_idx)
        # Put it at the top
        lines.insert(0, use_client_line)

    with open(filepath, 'w') as f:
        f.writelines(lines)

fix_file('src/app/schedule/admin/page.tsx')
fix_file('src/app/schedule/user/page.tsx')
