import { neon } from "@neondatabase/serverless";



export async function POST() {
  try {
    const databaseUrl = process.env.DATABASE_URL || ""; // Set a default value if DATABASE_URL is not defined
    const sql = neon(databaseUrl);
    //PostgresQL
    //Can be used to create tables

    //Create a users table containing id, email, name, role.
    const response1 = await sql`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            role VARCHAR(255) NOT NULL
        );`;

    //Create a schedules table containing id, description, status, due_date, piroty, assigned_to, created_by.
    const response2 = await sql`CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description VARCHAR(255) NOT NULL,
      status VARCHAR(255) NOT NULL,
      assigned_to VARCHAR(255) NOT NULL,
      created_by VARCHAR(255) NOT NULL,
      startDate VARCHAR(255) NOT NULL,
      startTime VARCHAR(255) NOT NULL,
      endDate VARCHAR(255) NOT NULL,
      endTime VARCHAR(255) NOT NULL,
      endDate VARCHAR(255) NOT NULL,
      priority VARCHAR(255) NOT NULL,
      due_date VARCHAR(255)
    );`;
    const response3 = await sql`CREATE TABLE IF NOT EXISTS history (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description VARCHAR(255) NOT NULL,
      status VARCHAR(255) NOT NULL,
      assigned_to VARCHAR(255) NOT NULL,
      created_by VARCHAR(255) NOT NULL,
      startDate VARCHAR(255) NOT NULL,
      startTime VARCHAR(255) NOT NULL,
      endDate VARCHAR(255) NOT NULL,
      endTime VARCHAR(255) NOT NULL,
      priority VARCHAR(255) NOT NULL,
      due_date VARCHAR(255)
    );`;

    return Response.json({ response1, response2, response3 }, { status: 200 });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}

//Delete all tables
export async function DELETE() {
  try {
    const databaseUrl = process.env.DATABASE_URL || ""; // Set a default value if DATABASE_URL is not defined
    const sql = neon(databaseUrl);
    //PostgresQL
    const response1 = await sql`DROP TABLE users;`;
    const response2 = await sql`DROP TABLE tasks;`;
    return Response.json({ response1, response2 }, { status: 200 });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
