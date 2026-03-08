import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

// Fetch a user by id
export async function GET({ params }: { params: { id: string | number } }) {
    const databaseUrl = process.env.DATABASE_URL || "";
    const sql = neon(databaseUrl);
    const id = Number(params.id);
    const response = await sql`SELECT * FROM users WHERE id = ${id};`;
    const user = response[0] as any;

    if (!user) {
        return new Response(null, { status: 404 });
    }

    // If user has a "role" field, convert it into a "roles" array.
    let modifiedUser;
    if (user.role) {
        modifiedUser = { ...user, roles: [user.role] };
        delete modifiedUser.role;
    } else {
        modifiedUser = user;
    }

    return NextResponse.json(modifiedUser, { status: 200 });
}

// Update all the information of a user
export async function PUT(
    request: Request,
    { params }: { params: { id: string | number } }
) {
    const databaseUrl = process.env.DATABASE_URL || "";
    const sql = neon(databaseUrl);
    const id = Number(params.id);
    const requestData = await request.json();

    // Update the user and return the updated row
    const response = await sql`
    UPDATE users 
    SET email = ${requestData.email}, name = ${requestData.name}, role = ${requestData.role} 
    WHERE id = ${id}
    RETURNING *;
  `;
    const updatedUser = response[0] as any;

    if (!updatedUser) {
        return new Response(null, { status: 404 });
    }

    let modifiedUser;
    if (updatedUser.role) {
        modifiedUser = { ...updatedUser, roles: [updatedUser.role] };
        delete modifiedUser.role;
    } else {
        modifiedUser = updatedUser;
    }

    return NextResponse.json(modifiedUser, { status: 200 });
}

// Delete a user by id
export async function DELETE(
    request: Request,
    { params }: { params: { id: string | number } }
) {
    const databaseUrl = process.env.DATABASE_URL || "";
    const sql = neon(databaseUrl);
    const id = Number(params.id);
    const response = await sql`DELETE FROM users WHERE id = ${id};`;

    if (!response) {
        return new Response(null, { status: 404 });
    }

    return new Response(null, { status: 200 });
}