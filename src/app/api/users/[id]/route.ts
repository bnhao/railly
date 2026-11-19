import { NextResponse } from "next/server";
import { getSql } from "@/utils/db";

// Fetch a user by id
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
    }

    const sql = getSql();
    const response = await sql`SELECT * FROM users WHERE id = ${userId};`;
    const user = response[0] as Record<string, unknown> | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        ...user,
        roles: user.role ? [String(user.role)] : [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user." },
      { status: 500 }
    );
  }
}

// Update a user
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
    }

    const sql = getSql();
    const requestData = await request.json();

    const response = await sql`
      UPDATE users
      SET
        email = ${requestData.email},
        name = ${requestData.name},
        role = ${requestData.role || "user"}
      WHERE id = ${userId}
      RETURNING *;
    `;

    const updatedUser = response[0] as Record<string, unknown> | undefined;
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        ...updatedUser,
        roles: updatedUser.role ? [String(updatedUser.role)] : [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to update user." },
      { status: 500 }
    );
  }
}

// Delete a user by id
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
    }

    const sql = getSql();
    const response = await sql`DELETE FROM users WHERE id = ${userId} RETURNING id;`;

    if (!response.length) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: userId }, { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to delete user." },
      { status: 500 }
    );
  }
}
