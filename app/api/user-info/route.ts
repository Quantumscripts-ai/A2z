import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: "Invalid user IDs" }, { status: 400 });
    }

    const userInfoMap: Record<string, { full_name: string; email: string }> =
      {};

    // Get user info for each user ID
    for (const userId of userIds) {
      try {
        const { data, error } =
          await supabaseAdmin.auth.admin.getUserById(userId);

        if (error || !data.user) {
          userInfoMap[userId] = {
            full_name: `User ${userId.substring(0, 8)}...`,
            email: "Email not available",
          };
        } else {
          userInfoMap[userId] = {
            full_name:
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              data.user.email?.split("@")[0] ||
              "Unknown User",
            email: data.user.email || "No email",
          };
        }
      } catch (userError) {
        console.error(`Error fetching user ${userId}:`, userError);
        userInfoMap[userId] = {
          full_name: `User ${userId.substring(0, 8)}...`,
          email: "Email not available",
        };
      }
    }

    return NextResponse.json({ userInfo: userInfoMap });
  } catch (error) {
    console.error("Error in user-info API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
