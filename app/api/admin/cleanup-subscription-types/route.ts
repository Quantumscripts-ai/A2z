import { NextRequest, NextResponse } from "next/server";
import {
  cleanupSubscriptionTypes,
  validateSubscriptionTypes,
} from "@/lib/cleanupSubscriptionTypes";

export async function POST(req: NextRequest) {
  try {
    // Only allow this in development or with proper authentication
    const isDevelopment = process.env.NODE_ENV === "development";
    const authHeader = req.headers.get("authorization");
    const isAuthorized = authHeader === `Bearer ${process.env.CLEANUP_SECRET}`;

    if (!isDevelopment && !isAuthorized) {
      return NextResponse.json(
        {
          error: "Unauthorized. This endpoint requires proper authentication.",
        },
        { status: 401 }
      );
    }

    const { action } = await req.json();

    if (action === "validate") {
      const result = await validateSubscriptionTypes();
      return NextResponse.json(result);
    } else if (action === "cleanup") {
      const result = await cleanupSubscriptionTypes();
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'validate' or 'cleanup'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in subscription cleanup API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Simple validation endpoint
  try {
    const result = await validateSubscriptionTypes();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in subscription validation API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
