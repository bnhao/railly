import { NextResponse } from "next/server";
import { getSql } from "@/utils/db";

// Fetch all users
export async function GET() {
  try {
    const sql = getSql();
    const response = await sql`SELECT * FROM users ORDER BY id ASC;`;

    // Preserve both `role` string and `roles` array for full client compatibility
    const modifiedUsers = response.map((user: Record<string, unknown>) => ({
      ...user,
      roles: user.role ? [String(user.role)] : [],
    }));

    return NextResponse.json(modifiedUsers, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users." },
      { status: 500 }
    );
  }
}

// Add a user
export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const name = String(requestData.name || "").trim();
    const email = String(requestData.email || "").trim();
    const role = String(requestData.role || "user").trim();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    const sql = getSql();
    const response = await sql`
      INSERT INTO users (name, email, role)
      VALUES (${name}, ${email}, ${role})
      RETURNING *;
    `;

    const created = response[0] as Record<string, unknown>;
    return NextResponse.json(
      {
        ...created,
        roles: created?.role ? [String(created.role)] : [role],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user." },
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
