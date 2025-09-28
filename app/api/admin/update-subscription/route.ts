import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// This endpoint should only be accessible to admins
// In a real application, you should implement proper role-based authorization

export async function POST(req: NextRequest) {
  try {
    // Verify admin auth here (simplified for example)
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

    // Check if user is admin (you'd need a proper admin check in a real app)
    // For example, check against an admin_users table or user.app_metadata.role === 'admin'

    const requestData = await req.json();
    const { userId, subscriptionType, durationMonths = 1 } = requestData;

    if (!userId || !subscriptionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate subscription type
    if (!["FREE", "PRO", "BUSINESS"].includes(subscriptionType)) {
      return NextResponse.json(
        { error: "Invalid subscription type" },
        { status: 400 }
      );
    }

    // Calculate subscription dates
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(
      subscriptionEndDate.getMonth() + durationMonths
    );

    // Update user subscription
    const { data: userData, error: userError } = await supabase
      .from("users")
      .update({
        subscription_type: subscriptionType,
        subscription_start_date:
          subscriptionType === "FREE"
            ? null
            : subscriptionStartDate.toISOString(),
        subscription_end_date:
          subscriptionType === "FREE"
            ? null
            : subscriptionEndDate.toISOString(),
      })
      .eq("id", userId)
      .select();

    if (userError) {
      console.error("Error updating user subscription:", userError);
      return NextResponse.json(
        { error: "Error updating subscription" },
        { status: 500 }
      );
    }

    // If this is a paid subscription, create a payment record for tracking
    if (subscriptionType !== "FREE") {
      // Determine price based on subscription type
      const amount =
        subscriptionType === "BUSINESS"
          ? 99 * durationMonths
          : 29 * durationMonths;

      const { data: paymentData, error: paymentError } = await supabase
        .from("payment_transactions")
        .insert({
          user_id: userId,
          payment_id: `admin_update_${Date.now()}`,
          amount_usd: amount,
          payment_status: "completed",
          created_at: subscriptionStartDate.toISOString(),
          completed_at: subscriptionStartDate.toISOString(),
        });

      if (paymentError) {
        console.error("Error recording payment transaction:", paymentError);
        // Don't return error here, as the subscription was already updated
      }
    }

    return NextResponse.json({
      success: true,
      message: "Subscription updated successfully",
      subscription: {
        type: subscriptionType,
        startDate: subscriptionType === "FREE" ? null : subscriptionStartDate,
        endDate: subscriptionType === "FREE" ? null : subscriptionEndDate,
      },
    });
  } catch (error) {
    console.error("Admin subscription update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
