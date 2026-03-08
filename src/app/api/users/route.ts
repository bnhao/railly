import { neon } from "@neondatabase/serverless";

/**
 * Sources used: 
 * https://webdev2-git-dv-dereksaits-projects.vercel.app/week-12/api-implementation#api-implementation-with-nextjs 
 * https://github.com/warsylewicz/webdev2/blob/main/pages/week-12/api-implementation.mdx 
 */

// Fetch all users
export async function GET() {
    const databaseUrl = process.env.DATABASE_URL || "";
    const sql = neon(databaseUrl);
    const response = await sql`SELECT * FROM users;`;

    // Convert each user's singular "role" field into a "roles" array
    const modifiedUsers = response.map((user: any) => {
        const { role, ...rest } = user;
        return { ...rest, roles: role ? [role] : [] };
    });

    console.log("API Response:", JSON.stringify(response, null, 2));


    return new Response(JSON.stringify(modifiedUsers), { status: 200 });
}

// Add a user
export async function POST(request: Request) {
    const requestData = await request.json();
    const databaseUrl = process.env.DATABASE_URL || "";
    const sql = neon(databaseUrl);
    // Insert the user with the singular "role" field (your frontend will convert it)
    const response = await sql`INSERT INTO users (name, email, role) VALUES (${requestData.name}, ${requestData.email}, ${requestData.role});`;
    return new Response(JSON.stringify(response), { status: 200 });
}

// Delete all users
export async function DELETE() {
    const databaseUrl = process.env.DATABASE_URL || "";
    const sql = neon(databaseUrl);
    const response = await sql`DELETE FROM users;`;
    return new Response(null, { status: 200 });
}