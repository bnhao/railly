import { NextResponse } from "next/server";
import { getSql } from "@/utils/db";

const VALID_STATUSES = new Set(["Pending", "In Progress", "Completed"]);

function normalizeCoordinatesValue(coords: unknown): string | null {
  if (coords === null || coords === undefined || coords === "") return null;
  if (typeof coords === "string") return coords;
  try {
    return JSON.stringify(coords);
  } catch {
    return String(coords);
  }
}

// Fetch all tasks joined with assigned crew details
export async function GET() {
  try {
    const sql = getSql();
    const response = await sql`
      SELECT
        t.*,
        u.name AS assigned_to_name,
        u.email AS assigned_to_email
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      ORDER BY t.id DESC;
    `;
    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks." },
      { status: 500 }
    );
  }
}

// Create a new work order + write audit record in history
export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const sql = getSql();

    const title = String(requestData.title || "").trim();
    const description = String(requestData.description || "").trim();
    const status = String(requestData.status || "Pending").trim();
    const createdBy = String(requestData.created_by || "Supervisor").trim();
    const startDate = String(requestData.start_date || "").trim();
    const startTime = String(requestData.start_time || "08:00").trim();
    const endDate = String(requestData.end_date || startDate).trim();
    const endTime = String(requestData.end_time || "16:00").trim();
    const priority = String(requestData.priority || "Medium").trim();
    const trackId = String(requestData.track_id || "").trim();
    const coords = normalizeCoordinatesValue(requestData.coordinates);
    const assignedToRaw = requestData.assigned_to;
    const assignedTo =
      assignedToRaw !== undefined &&
      assignedToRaw !== null &&
      assignedToRaw !== "" &&
      Number(assignedToRaw) > 0
        ? Number(assignedToRaw)
        : null;

    if (!title || !description || !startDate || !trackId) {
      return NextResponse.json(
        { error: "Missing required work order fields (title, description, start_date, track_id)." },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "Invalid status. Expected Pending, In Progress, or Completed." },
        { status: 400 }
      );
    }

    const inserted = await sql`
      INSERT INTO tasks (
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
        ${title},
        ${description},
        ${status},
        ${assignedTo},
        ${createdBy},
        ${startDate},
        ${startTime},
        ${endDate},
        ${endTime},
        ${priority},
        ${trackId},
        ${coords}
      )
      RETURNING *;
    `;

    const created = inserted[0];

    // Record history entry in non-blocking fashion so dispatch creation never fails on log write
    try {
      await sql`
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
          ${title},
          ${description},
          ${status},
          ${assignedTo !== null ? String(assignedTo) : "Unassigned"},
          ${createdBy},
          ${startDate},
          ${startTime},
          ${endDate},
          ${endTime},
          ${priority},
          ${trackId},
          ${coords}
        );
      `;
    } catch (historyErr) {
      console.warn("History log insert warning:", historyErr);
    }

    let assignedName: string | null = null;
    let assignedEmail: string | null = null;
    if (created?.assigned_to) {
      const userRows = await sql`
        SELECT name, email FROM users WHERE id = ${created.assigned_to};
      `;
      assignedName = (userRows[0]?.name as string) ?? null;
      assignedEmail = (userRows[0]?.email as string) ?? null;
    }

    return NextResponse.json(
      {
        ...created,
        assigned_to_name: assignedName,
        assigned_to_email: assignedEmail,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to create task." },
      { status: 500 }
    );
  }
}

// Modify task using real Postgres schema columns
export async function PUT(request: Request) {
  try {
    const sql = getSql();
    const requestData = await request.json();
    const id = Number(requestData.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Valid task id is required." }, { status: 400 });
    }

    const assignedTo =
      requestData.assigned_to !== undefined &&
      requestData.assigned_to !== null &&
      requestData.assigned_to !== "" &&
      Number(requestData.assigned_to) > 0
        ? Number(requestData.assigned_to)
        : null;

    const coords = normalizeCoordinatesValue(requestData.coordinates);

    const updated = await sql`
      UPDATE tasks SET
        title = COALESCE(${requestData.title ?? null}, title),
        description = COALESCE(${requestData.description ?? null}, description),
        status = COALESCE(${requestData.status ?? null}, status),
        assigned_to = ${assignedTo},
        created_by = COALESCE(${requestData.created_by ?? null}, created_by),
        start_date = COALESCE(${requestData.start_date ?? null}, start_date),
        start_time = COALESCE(${requestData.start_time ?? null}, start_time),
        end_date = COALESCE(${requestData.end_date ?? null}, end_date),
        end_time = COALESCE(${requestData.end_time ?? null}, end_time),
        priority = COALESCE(${requestData.priority ?? null}, priority),
        track_id = COALESCE(${requestData.track_id ?? null}, track_id),
        coordinates = COALESCE(${coords}, coordinates)
      WHERE id = ${id}
      RETURNING *;
    `;

    if (!updated.length) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const joined = await sql`
      SELECT
        t.*,
        u.name AS assigned_to_name,
        u.email AS assigned_to_email
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ${id};
    `;

    return NextResponse.json(joined[0] ?? updated[0], { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to update task." },
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
