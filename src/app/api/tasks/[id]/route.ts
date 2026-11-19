import { NextResponse } from "next/server";
import { getSql } from "@/utils/db";

const VALID_STATUSES = new Set(["Pending", "In Progress", "Completed"]);

function normalizeCoordinatesValue(coords: unknown): string | null | undefined {
  if (coords === undefined) return undefined;
  if (coords === null || coords === "") return null;
  if (typeof coords === "string") return coords;
  try {
    return JSON.stringify(coords);
  } catch {
    return String(coords);
  }
}

function toSqlDateString(val: unknown): string {
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(val || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return s;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

async function fetchJoinedTaskById(taskId: number) {
  const sql = getSql();
  const rows = await sql`
    SELECT
      t.*,
      u.name AS assigned_to_name,
      u.email AS assigned_to_email
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.id = ${taskId};
  `;
  return rows[0] ?? null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const taskId = Number(id);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return NextResponse.json({ error: "Invalid task ID." }, { status: 400 });
    }

    const task = await fetchJoinedTaskById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const taskId = Number(id);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return NextResponse.json({ error: "Invalid task ID." }, { status: 400 });
    }

    const existing = await fetchJoinedTaskById(taskId);
    if (!existing) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const body = await request.json();

    if (body.status !== undefined && !VALID_STATUSES.has(String(body.status))) {
      return NextResponse.json(
        { error: "Invalid status. Expected Pending, In Progress, or Completed." },
        { status: 400 }
      );
    }

    let nextAssignedTo: number | null =
      existing.assigned_to !== undefined ? (existing.assigned_to as number | null) : null;
    if (body.assigned_to !== undefined) {
      nextAssignedTo =
        body.assigned_to === null ||
        body.assigned_to === "" ||
        Number(body.assigned_to) <= 0
          ? null
          : Number(body.assigned_to);
    }

    const coordsInput = normalizeCoordinatesValue(body.coordinates);
    const nextCoords =
      coordsInput !== undefined
        ? coordsInput
        : (existing.coordinates as string | null);

    const nextTitle = body.title !== undefined ? String(body.title).trim() : String(existing.title);
    const nextDesc = body.description !== undefined ? String(body.description).trim() : String(existing.description);
    const nextStatus = body.status !== undefined ? String(body.status) : String(existing.status);
    const nextPriority = body.priority !== undefined ? String(body.priority) : String(existing.priority);
    const nextStartDate =
      body.start_date !== undefined
        ? toSqlDateString(body.start_date)
        : toSqlDateString(existing.start_date);
    const nextStartTime =
      body.start_time !== undefined
        ? String(body.start_time)
        : String(existing.start_time);
    const nextEndDate =
      body.end_date !== undefined
        ? toSqlDateString(body.end_date)
        : toSqlDateString(existing.end_date);
    const nextEndTime =
      body.end_time !== undefined
        ? String(body.end_time)
        : String(existing.end_time);
    const nextTrackId = body.track_id !== undefined ? String(body.track_id).trim() : String(existing.track_id || "");

    const sql = getSql();
    await sql`
      UPDATE tasks SET
        title = ${nextTitle},
        description = ${nextDesc},
        status = ${nextStatus},
        assigned_to = ${nextAssignedTo},
        priority = ${nextPriority},
        start_date = ${nextStartDate},
        start_time = ${nextStartTime},
        end_date = ${nextEndDate},
        end_time = ${nextEndTime},
        track_id = ${nextTrackId},
        coordinates = ${nextCoords}
      WHERE id = ${taskId};
    `;

    const updatedTask = await fetchJoinedTaskById(taskId);
    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to update task." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const taskId = Number(id);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return NextResponse.json({ error: "Invalid task ID." }, { status: 400 });
    }

    const sql = getSql();
    const response = await sql`
      DELETE FROM tasks WHERE id = ${taskId} RETURNING id;
    `;

    if (!response.length) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: taskId }, { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to delete task." },
      { status: 500 }
    );
  }
}
