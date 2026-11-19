import { NextResponse } from "next/server";
import { getSql } from "@/utils/db";

// Get a single feedback by ID
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const feedbackId = Number(id);
    if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
      return NextResponse.json({ error: "Invalid feedback ID." }, { status: 400 });
    }

    const sql = getSql();
    const response = await sql`
      SELECT * FROM feedback WHERE feedback_id = ${feedbackId};
    `;
    const feedback = response[0];

    if (!feedback) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return NextResponse.json(feedback, { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback." },
      { status: 500 }
    );
  }
}

// Update a specific feedback entry
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const feedbackId = Number(id);
    if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
      return NextResponse.json({ error: "Invalid feedback ID." }, { status: 400 });
    }

    const sql = getSql();
    const data = await request.json();

    const response = await sql`
      UPDATE feedback
      SET
        created_by = COALESCE(${data.created_by ?? null}, created_by),
        description = ${data.description},
        suggestion = ${data.suggestion},
        updated_at = CURRENT_TIMESTAMP
      WHERE feedback_id = ${feedbackId}
      RETURNING *;
    `;

    const updatedFeedback = response[0];
    if (!updatedFeedback) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return NextResponse.json(updatedFeedback, { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to update feedback." },
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
    const feedbackId = Number(id);
    if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
      return NextResponse.json({ error: "Invalid feedback ID." }, { status: 400 });
    }

    const sql = getSql();
    const deleted = await sql`
      DELETE FROM feedback WHERE feedback_id = ${feedbackId} RETURNING feedback_id;
    `;

    if (!deleted.length) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to delete feedback." },
      { status: 500 }
    );
  }
}
