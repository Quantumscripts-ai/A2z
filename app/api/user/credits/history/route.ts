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

    // Get URL parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // Get credit usage history
    const history = await CreditManager.getCreditUsageHistory(user.id, limit);

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching credit history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
