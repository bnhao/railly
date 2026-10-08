import os

admin_path = "src/components/dashboard/AdminDashboardClient.tsx"

with open(admin_path, "r") as f:
    content = f.read()

# Replace AdminDashboardClient with DashboardClient
content = content.replace("export default function AdminDashboardClient()", "export default function DashboardClient()")

# We want the allowedRoles to be ["admin", "user"]
content = content.replace('allowedRoles={["admin"]}', 'allowedRoles={["admin", "user"]}')

# Inside the table, the action buttons should only render if role === "admin"
# We can find the <th>Actions</th> (wait, AdminDashboardClient doesn't have <th>Actions</th>! Let's check AdminDashboardClient again)
