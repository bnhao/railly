import { NextRequest, NextResponse } from "next/server";
import firebaseAdmin from "@/app/_utils/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameter
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Initialize Firestore
    const db = firebaseAdmin.firestore();

    // Get user document from Firestore
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData) {
      return NextResponse.json(
        { error: "User data is empty" },
        { status: 404 }
      );
    }

    // First check for the singular 'role' field
    let role = userData.role;

    // If no role field, check for roles array
    if (!role && Array.isArray(userData.roles) && userData.roles.length > 0) {
      // If user has admin in roles array, use that
      if (userData.roles.includes("admin")) {
        role = "admin";
      } else {
        // Otherwise use the first role in the array
        role = userData.roles[0];
      }
    }

    // Default to user if still no role
    role = role || "user";

    // Handle case-insensitivity
    if (typeof role === "string" && role.toLowerCase() === "admin") {
      role = "admin";
    }

    // Return role information
    return NextResponse.json({
      userId,
      role,
      permissions: getRolePermissions(role),
    });
  } catch (error: unknown) {
    console.error("Error fetching user role:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user role",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Helper function to map roles to specific permissions
function getRolePermissions(role: string): string[] {
  switch (role.toLowerCase()) {
    case "admin":
      return [
        "users:read",
        "users:write",
        "users:delete",
        "tracks:read",
        "tracks:write",
      ];
    case "user":
    default:
      return ["tracks:read"];
  }
}
