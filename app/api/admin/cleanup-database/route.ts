import { NextRequest, NextResponse } from "next/server";
import { DatabaseCleanup } from "@/lib/databaseCleanup";

export async function POST(req: NextRequest) {
  try {
    // Add some basic authentication - you should only call this endpoint when needed
    const authHeader = req.headers.get("x-cleanup-secret");
    const expectedSecret =
      process.env.DATABASE_CLEANUP_SECRET || "cleanup-secret-key";

    if (!authHeader || authHeader !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json();

    if (action === "cleanup-duplicates") {
      const result = await DatabaseCleanup.cleanupCreditDuplicates();
      return NextResponse.json(result);
    } else if (action === "initialize-all-users") {
      const result = await DatabaseCleanup.initializeAllUserCredits();
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        {
          error: "Invalid action",
          availableActions: ["cleanup-duplicates", "initialize-all-users"],
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Database cleanup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
