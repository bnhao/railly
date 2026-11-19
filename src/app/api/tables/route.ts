import { NextResponse } from "next/server";
import { getSql } from "@/utils/db";

export async function POST() {
  try {
    const sql = getSql();

    const response1 = await sql`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(255) NOT NULL
    );`;

    const response2 = await sql`CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(255) NOT NULL,
      assigned_to INTEGER,
      created_by VARCHAR(255) NOT NULL,
      start_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_date DATE NOT NULL,
      end_time TIME NOT NULL,
      priority VARCHAR(255) NOT NULL,
      track_id VARCHAR(255),
      coordinates VARCHAR(255)
    );`;

    const response3 = await sql`CREATE TABLE IF NOT EXISTS history (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description VARCHAR(255) NOT NULL,
      status VARCHAR(255) NOT NULL,
      assigned_to VARCHAR(255) NOT NULL,
      created_by VARCHAR(255) NOT NULL,
      start_date VARCHAR(255) NOT NULL,
      start_time VARCHAR(255) NOT NULL,
      end_date VARCHAR(255) NOT NULL,
      end_time VARCHAR(255) NOT NULL,
      priority VARCHAR(255) NOT NULL,
      track_id VARCHAR(255),
      coordinates VARCHAR(255)
    );`;

    return NextResponse.json(
      { response1, response2, response3 },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Dropping database tables via HTTP is disabled." },
    { status: 405 }
  );
}
