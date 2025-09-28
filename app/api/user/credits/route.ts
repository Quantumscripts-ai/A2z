import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { CreditManager } from "@/lib/creditManager";

export async function GET(req: Request) {
  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Get the user from the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user credits
    const credits = await CreditManager.getUserCredits(user.id);

    return NextResponse.json({ credits });
  } catch (error) {
    console.error("Error fetching credits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Get the user from the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, amount, details } = body;

    if (!action || !amount) {
      return NextResponse.json(
        { error: "Action and amount are required" },
        { status: 400 }
      );
    }

    let result;

    if (action === "deduct") {
      result = await CreditManager.deductCredits(
        user.id,
        amount,
        "video_generation",
        details
      );
      return NextResponse.json(result);
    } else if (action === "add") {
      const newBalance = await CreditManager.addCredits(
        user.id,
        amount,
        details?.type || "purchase",
        details
      );
      return NextResponse.json({ success: true, newBalance });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'deduct' or 'add'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error processing credit operation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
