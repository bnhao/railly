import { NextResponse } from "next/server";
import { getSql } from "@/utils/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const historyId = Number(id);
    if (!Number.isInteger(historyId) || historyId <= 0) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

    const sql = getSql();
    const response = await sql`SELECT * FROM history WHERE id = ${historyId};`;
    if (!response.length) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return NextResponse.json(response[0], { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history entry." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const historyId = Number(id);
    if (!Number.isInteger(historyId) || historyId <= 0) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

    const sql = getSql();
    const requestData = await request.json();
    const response = await sql`
      UPDATE history SET
        description = COALESCE(${requestData.description ?? null}, description),
        status = COALESCE(${requestData.status ?? null}, status),
        assigned_to = COALESCE(${requestData.assigned_to !== undefined ? String(requestData.assigned_to) : null}, assigned_to),
        created_by = COALESCE(${requestData.created_by ?? null}, created_by),
        end_date = COALESCE(${requestData.end_date ?? null}, end_date),
        priority = COALESCE(${requestData.priority ?? null}, priority)
      WHERE id = ${historyId}
      RETURNING *;
    `;

    if (!response.length) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return NextResponse.json(response[0], { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to update history entry." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const historyId = Number(id);
    if (!Number.isInteger(historyId) || historyId <= 0) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

    const sql = getSql();
    const response = await sql`
      DELETE FROM history WHERE id = ${historyId} RETURNING id;
    `;

    if (!response.length) {
      return NextResponse.json({ error: "History entry not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to delete history entry." },
      { status: 500 }
    );
  }
}
