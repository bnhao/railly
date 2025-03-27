import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

/**
 * 
 * Sources used: 
 * https://webdev2-git-dv-dereksaits-projects.vercel.app/week-12/api-implementation#api-implementation-with-nextjs 
 * https://github.com/warsylewicz/webdev2/blob/main/pages/week-12/api-implementation.mdx 
 */

//Fetch All history - Mark
export async function GET() {
  const databaseUrl = process.env.DATABASE_URL || ""; // Set a default value if DATABASE_URL is not defined
  const sql = neon(databaseUrl);
  //PostgresQL
  const response = await sql`SELECT * FROM history;`;
  return new Response(JSON.stringify(response), { status: 200 });
}

// Add task - Daniel
export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const databaseUrl = process.env.DATABASE_URL || "";
    const sql = neon(databaseUrl);

    // Validate request data
    if (!requestData.title || !requestData.description || !requestData.status || !requestData.assigned_to || !requestData.created_by || !requestData.start_date || !requestData.start_time || !requestData.end_date || !requestData.end_time || !requestData.priority || !requestData.track_id || !requestData.coordinates) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Debug log for track_id
    console.log('Received track_id:', requestData.track_id);

    // Insert the task into the database
    const response = await sql`
      INSERT INTO history (title, description, status, assigned_to, created_by, start_date, start_time, end_date, end_time, priority, track_id, coordinates)
      VALUES (${requestData.title}, ${requestData.description}, ${requestData.status}, ${requestData.assigned_to}, ${requestData.created_by}, ${requestData.start_date}, ${requestData.start_time}, ${requestData.end_date}, ${requestData.end_time}, ${requestData.priority}, ${requestData.track_id}, ${requestData.coordinates})
      RETURNING *;
    `;

    // Log the response for debugging
    console.log("Insert response:", response);

    // Return the newly created task
    return NextResponse.json(response[0], { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to create task." }, { status: 500 });
  }
}

// Modify task - Mark
export async function PUT(request: Request) {
  const databaseUrl = process.env.DATABASE_URL || ""; // Set a default value if DATABASE_URL is not defined
  const sql = neon(databaseUrl);
  //PostgresQL
  const requestData = await request.json();
  const response = await sql`

        UPDATE history SET
            description = ${requestData.description}, 
            status = ${requestData.status},
            assigned_to = ${requestData.assigned_to},
            created_by = ${requestData.created_by},
            due_date = ${requestData.due_date},
            priotity = ${requestData.priotity},
            WHERE id = ${requestData.id};`;

  return new Response(JSON.stringify(response), { status: 200 });
}

//Delete all history - Nathan Delete all tasks from table. Keep table.

export async function DELETE() {
  const databaseUrl = process.env.DATABASE_URL || ""; // Set a default value if DATABASE_URL is not defined
  const sql = neon(databaseUrl);

  const response = await sql`DELETE FROM schedules;`;

  return new Response(null, { status: 200 });
}
