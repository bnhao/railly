import { NextResponse } from "next/server";
import { getSql } from "@/utils/db";

// Fetch history (filtered server-side by track_id when provided)
export async function GET(request: Request) {
  try {
    const sql = getSql();
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get("track_id");

    const response = trackId
      ? await sql`SELECT * FROM history WHERE track_id = ${trackId} ORDER BY id DESC;`
      : await sql`SELECT * FROM history ORDER BY id DESC;`;

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history." },
      { status: 500 }
    );
  }
}

// Add history entry
export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const sql = getSql();

    if (
      !requestData.title ||
      !requestData.description ||
      !requestData.status ||
      !requestData.created_by ||
      !requestData.start_date ||
      !requestData.start_time ||
      !requestData.end_date ||
      !requestData.end_time ||
      !requestData.priority ||
      !requestData.track_id
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const assignedTo =
      requestData.assigned_to !== undefined && requestData.assigned_to !== null
        ? String(requestData.assigned_to)
        : "Unassigned";

    const coords =
      requestData.coordinates === undefined || requestData.coordinates === null
        ? null
        : typeof requestData.coordinates === "string"
          ? requestData.coordinates
          : JSON.stringify(requestData.coordinates);

    const response = await sql`
      INSERT INTO history (
        title,
        description,
        status,
        assigned_to,
        created_by,
        start_date,
        start_time,
        end_date,
        end_time,
        priority,
        track_id,
        coordinates
      )
      VALUES (
        ${requestData.title},
        ${requestData.description},
        ${requestData.status},
        ${assignedTo},
        ${requestData.created_by},
        ${requestData.start_date},
        ${requestData.start_time},
        ${requestData.end_date},
        ${requestData.end_time},
        ${requestData.priority},
        ${requestData.track_id},
        ${coords}
      )
      RETURNING *;
    `;

    return NextResponse.json(response[0], { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to create history entry." },
      { status: 500 }
    );
  }
}

// Modify history entry using actual schema columns
export async function PUT(request: Request) {
  try {
    const sql = getSql();
    const requestData = await request.json();
    const id = Number(requestData.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid history ID." }, { status: 400 });
    }

    const response = await sql`
      UPDATE history SET
        description = COALESCE(${requestData.description ?? null}, description),
        status = COALESCE(${requestData.status ?? null}, status),
        assigned_to = COALESCE(${requestData.assigned_to !== undefined ? String(requestData.assigned_to) : null}, assigned_to),
        created_by = COALESCE(${requestData.created_by ?? null}, created_by),
        end_date = COALESCE(${requestData.end_date ?? null}, end_date),
        priority = COALESCE(${requestData.priority ?? null}, priority)
      WHERE id = ${id}
      RETURNING *;
    `;

    return NextResponse.json(response[0] ?? null, { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to update history entry." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Bulk delete is disabled." },
    { status: 405 }
  );
}
