import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { CreditManager } from "@/lib/creditManager";
import { SUBSCRIPTION_PLANS } from "@/constants";

// This endpoint will be called by your Supabase Edge Function
// when a new payment is processed
export async function POST(req: NextRequest) {
  try {
    // Verify the request is coming from your Supabase Edge Function
    // You should implement proper authentication here
    // For example, check for a shared secret key
    const authHeader = req.headers.get("x-supabase-webhook-secret");
    const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    if (!authHeader || authHeader !== expectedSecret) {
      console.error("Unauthorized webhook call");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the payment data from the edge function
    const paymentData = await req.json();

    // Extract relevant information from the payment_subscriptions table entry
    const {
      user_id,
      subscription_id,
      subscription_type,
      payment_amount,
      billing_cycle,
      created_at,
      custom_credits, // For custom plans
    } = paymentData;

    if (!user_id || !subscription_id) {
      console.error("Missing required fields in payment data");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine subscription plan type (STANDARD/PRO/BUSINESS/CUSTOM)
    let planType: "STANDARD" | "PRO" | "BUSINESS" | "CUSTOM" = "STANDARD"; // Default to STANDARD
    let creditsToAdd = 0;

    if (subscription_type) {
      planType = subscription_type.toUpperCase() as
        | "STANDARD"
        | "PRO"
        | "BUSINESS"
        | "CUSTOM";
    } else if (payment_amount >= 99) {
      planType = "BUSINESS";
    } else if (payment_amount >= 29) {
      planType = "PRO";
    } else if (custom_credits) {
      planType = "CUSTOM";
    }

    // Calculate credits based on plan type
    if (planType === "CUSTOM" && custom_credits) {
      creditsToAdd = custom_credits;
    } else {
      creditsToAdd = CreditManager.getCreditsForPlan(planType);
    }

    // Calculate subscription period based on billing cycle
    const isAnnual = billing_cycle === "yearly";
    const subscriptionStartDate = new Date(created_at || new Date());
    const subscriptionEndDate = new Date(subscriptionStartDate);

    if (isAnnual) {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    }

    console.log(
      `Updating user ${user_id} to ${planType} subscription with ${creditsToAdd} credits`
    );

    // Update the user's subscription in the database
    const { data: updateData, error: updateError } = await supabase
      .from("users")
      .update({
        subscription_type: planType,
        subscription_start_date: subscriptionStartDate.toISOString(),
        subscription_end_date: subscriptionEndDate.toISOString(),
      })
      .eq("id", user_id);

    if (updateError) {
      console.error("Error updating user subscription:", updateError);
      return NextResponse.json(
        { error: "Database update failed" },
        { status: 500 }
      );
    }

    // Add credits to user's account
    if (creditsToAdd > 0) {
      try {
        const newBalance = await CreditManager.addCredits(
          user_id,
          creditsToAdd,
          "purchase",
          {
            plan_type: planType,
            payment_amount: payment_amount,
            billing_cycle: billing_cycle,
            subscription_id: subscription_id,
          }
        );
        console.log(
          `Added ${creditsToAdd} credits to user ${user_id}. New balance: ${newBalance}`
        );
      } catch (creditError) {
        console.error("Error adding credits:", creditError);
        // Don't fail the entire operation if credit addition fails
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Subscription updated successfully",
      user_id,
      subscription_type: planType,
      subscription_start: subscriptionStartDate,
      subscription_end: subscriptionEndDate,
      credits_added: creditsToAdd,
    });
  } catch (error) {
    console.error("Error processing subscription update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
