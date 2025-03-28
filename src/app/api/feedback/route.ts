import { neon } from "@neondatabase/serverless";

// Get all feedback entries
export async function GET() {
  const databaseUrl = process.env.DATABASE_URL || "";
  const sql = neon(databaseUrl);

  const response = await sql`SELECT * FROM feedback ORDER BY created_at DESC;`;

  return new Response(JSON.stringify(response), { status: 200 });
}

// Add a new feedback entry
export async function POST(request: Request) {
  const data = await request.json();
  const databaseUrl = process.env.DATABASE_URL || "";
  const sql = neon(databaseUrl);

  const response = await sql`
    INSERT INTO feedback (created_by, description, suggestion)
    VALUES (${data.created_by}, ${data.description}, ${data.suggestion})
    RETURNING *;
  `;

  return new Response(JSON.stringify(response[0]), { status: 200 });
}

