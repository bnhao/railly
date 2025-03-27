import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

// Get a single feedback by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string | number } }
) {
  const databaseUrl = process.env.DATABASE_URL || "";
  const sql = neon(databaseUrl);
  const id = Number(params.id);

  const response = await sql`SELECT * FROM feedback WHERE feedback_id = ${id};`;
  const feedback = response[0] as any;

  if (!feedback) {
    return new Response(null, { status: 404 });
  }

  return NextResponse.json(feedback, { status: 200 });
}

// Update a specific feedback entry
export async function PUT(
  request: Request,
  { params }: { params: { id: string | number } }
) {
  const databaseUrl = process.env.DATABASE_URL || "";
  const sql = neon(databaseUrl);
  const id = Number(params.id);
  const data = await request.json();

  const response = await sql`
    UPDATE feedback
    SET 
      created_by = ${data.created_by},
      description = ${data.description},
      suggestion = ${data.suggestion},
      updated_at = CURRENT_TIMESTAMP
    WHERE feedback_id = ${id}
    RETURNING *;
  `;

  const updatedFeedback = response[0] as any;

  if (!updatedFeedback) {
    return new Response(null, { status: 404 });
  }

  return NextResponse.json(updatedFeedback, { status: 200 });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string | number } }
) {
  const databaseUrl = process.env.DATABASE_URL || "";
  const sql = neon(databaseUrl);
  const id = Number(params.id);

  await sql`DELETE FROM feedback WHERE feedback_id = ${id};`;

  return new Response(null, { status: 200 });
}
