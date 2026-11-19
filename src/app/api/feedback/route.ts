import { NextResponse } from "next/server";
import { getSql } from "@/utils/db";

// Get all feedback entries
export async function GET() {
  const sql = getSql();
  const response = await sql`SELECT * FROM feedback ORDER BY created_at DESC;`;

  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
    },
  });
}

// Add a new feedback entry
export async function POST(request: Request) {
  const data = await request.json();
  const sql = getSql();

  const response = await sql`
    INSERT INTO feedback (created_by, description, suggestion)
    VALUES (${data.created_by}, ${data.description}, ${data.suggestion})
    RETURNING *;
  `;

  return NextResponse.json(response[0], { status: 200 });
}
