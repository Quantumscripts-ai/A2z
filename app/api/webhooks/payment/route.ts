import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // Get the payment webhook data
    const webhookData = await req.json();

    // Verify the webhook signature (implementation depends on your payment provider)
    // This is a simplified example - in a real app, you should verify the webhook is authentic

    // Extract user ID and payment details from the webhook data
    // This structure will vary based on your payment provider's webhook format
    const {
      userId,
      paymentId,
      amount,
      status,
      planType,
      billingCycle, // "monthly" or "yearly"
    } = webhookData;

    if (!userId || !paymentId || !amount || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Only process successful payments
    if (status !== "completed" && status !== "succeeded") {
      return NextResponse.json(
        { message: "Payment not completed" },
        { status: 200 }
      );
    }

    // Determine subscription type based on amount or plan information
    let subscriptionType = "STANDARD";
    if (planType) {
      const upperPlanType = planType.toUpperCase();
      // Only use planType if it's a valid plan type, not a billing cycle
      if (["STANDARD", "PRO", "BUSINESS", "CUSTOM"].includes(upperPlanType)) {
        subscriptionType = upperPlanType;
      } else {
        // If planType is not a valid plan type (e.g., "yearly", "monthly"),
        // determine type by amount
        if (amount >= 99) {
          subscriptionType = "BUSINESS";
        } else if (amount >= 29) {
          subscriptionType = "PRO";
        } else {
          subscriptionType = "STANDARD";
        }
      }
    } else if (amount >= 99) {
      subscriptionType = "BUSINESS";
    } else if (amount >= 29) {
      subscriptionType = "PRO";
    } else {
      subscriptionType = "STANDARD";
    }

    // Calculate subscription duration
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();
    if (billingCycle === "yearly") {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    }

    // Record the payment transaction
    const { data: paymentData, error: paymentError } = await supabase
      .from("payment_transactions")
      .insert({
        user_id: userId,
        payment_id: paymentId,
        amount_usd: amount,
        payment_status: status,
        created_at: subscriptionStartDate.toISOString(),
        completed_at: subscriptionStartDate.toISOString(),
      });

    if (paymentError) {
      console.error("Error recording payment transaction:", paymentError);
      return NextResponse.json(
        { error: "Error recording payment" },
        { status: 500 }
      );
    }

    // Update user subscription information
    const { data: userData, error: userError } = await supabase
      .from("users")
      .update({
        subscription_type: subscriptionType,
        subscription_start_date: subscriptionStartDate.toISOString(),
        subscription_end_date: subscriptionEndDate.toISOString(),
        // If you're selling tokens as well, you might update token_balance here
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

    return NextResponse.json({
      success: true,
      message: "Subscription updated successfully",
      subscription: {
        type: subscriptionType,
        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate,
      },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
