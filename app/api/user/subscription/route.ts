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

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the user exists in the users table
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    // If user doesn't exist in users table, create a record
    if (existingUserError && existingUserError.code === "PGRST116") {
      // User not found, create a new user record
      const { error: createUserError } = await supabase.from("users").insert({
        id: user.id,
        email: user.email,
        full_name:
          user.user_metadata?.full_name || user.user_metadata?.name || "",
        subscription_type: "NA",
        token_balance: 0,
        total_tokens_purchased: 0,
        total_videos_processed: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (createUserError) {
        console.error("Error creating user record:", createUserError);
        return NextResponse.json(
          { error: "Failed to create user profile" },
          { status: 500 }
        );
      }

      console.log(`Created new user record for ${user.id}`);
    }

    // Get the user's data including subscription details
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(
        "id, email, full_name, token_balance, total_tokens_purchased, total_videos_processed, subscription_type, subscription_start_date, subscription_end_date"
      )
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user data:", userError);
      return NextResponse.json(
        { error: "Error fetching user data" },
        { status: 500 }
      );
    }

    // Also check the payment_subscriptions table for the most recent active subscription
    // This ensures we get the most up-to-date subscription status, even if the users table hasn't been updated yet
    const { data: subscriptionDataArray, error: subscriptionError } =
      await supabase
        .from("payment_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

    // Get the first item if available
    const subscriptionData =
      subscriptionDataArray && subscriptionDataArray.length > 0
        ? subscriptionDataArray[0]
        : null;

    // Determine the most up-to-date subscription status
    // If there's a recent payment_subscription and it's newer than the user's subscription_start_date,
    // use that instead of the user table's subscription_type
    let subscriptionStatus = userData.subscription_type as
      | "NA"
      | "STANDARD"
      | "PRO"
      | "BUSINESS"
      | "CUSTOM";

    // Check if we have a valid subscription from payment_subscriptions table
    if (!subscriptionError && subscriptionData) {
      const subscriptionCreatedAt = new Date(subscriptionData.created_at);
      const userSubStartDate = userData.subscription_start_date
        ? new Date(userData.subscription_start_date)
        : null;

      // If payment subscription is more recent than user's subscription_start_date
      // or if user doesn't have a subscription_start_date, use the payment subscription
      if (!userSubStartDate || subscriptionCreatedAt > userSubStartDate) {
        // Determine subscription type from payment data based on amount
        // Since subscription_type in payment_subscriptions might contain billing cycle info,
        // we'll determine the plan type based on payment amount for consistency
        if (subscriptionData.payment_amount >= 99) {
          subscriptionStatus = "BUSINESS";
        } else if (subscriptionData.payment_amount >= 29) {
          subscriptionStatus = "PRO";
        } else if (subscriptionData.payment_amount > 0) {
          subscriptionStatus = "STANDARD";
        } else {
          // Check if subscription_type contains valid plan type
          if (subscriptionData.subscription_type) {
            const paymentPlan =
              subscriptionData.subscription_type.toUpperCase();
            if (
              ["STANDARD", "PRO", "BUSINESS", "CUSTOM"].includes(paymentPlan)
            ) {
              subscriptionStatus = paymentPlan as
                | "STANDARD"
                | "PRO"
                | "BUSINESS"
                | "CUSTOM";
            } else {
              subscriptionStatus = "STANDARD"; // Default fallback
            }
          } else {
            subscriptionStatus = "STANDARD"; // Default fallback
          }
        }
      }

      // If the user table hasn't been updated yet, update it now
      if (subscriptionStatus !== userData.subscription_type) {
        try {
          // Calculate subscription end date based on billing cycle
          const subscriptionStartDate = subscriptionCreatedAt;
          const subscriptionEndDate = new Date(subscriptionStartDate);

          if (subscriptionData.billing_cycle === "yearly") {
            subscriptionEndDate.setFullYear(
              subscriptionEndDate.getFullYear() + 1
            );
          } else {
            subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
          }

          // Update the user record with the subscription info
          const { error: updateError } = await supabase
            .from("users")
            .update({
              subscription_type: subscriptionStatus,
              subscription_start_date: subscriptionStartDate.toISOString(),
              subscription_end_date: subscriptionEndDate.toISOString(),
            })
            .eq("id", user.id);

          if (updateError) {
            console.error(
              "Error updating user subscription data:",
              updateError
            );
            // Continue execution as we can still return the current data
          }
        } catch (updateError) {
          console.error("Error in subscription update process:", updateError);
          // Continue execution as we can still return the current data
        }
      }
    }

    // Get the user's most recent successful payment
    const { data: latestPaymentArray, error: paymentError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("payment_status", "completed")
      .order("created_at", { ascending: false })
      .limit(1);

    // Log payment error if any
    if (paymentError) {
      console.error("Error fetching payment transactions:", paymentError);
      // Continue execution as this is not a critical error
    }

    // Get the first item if available
    const latestPayment =
      latestPaymentArray && latestPaymentArray.length > 0
        ? latestPaymentArray[0]
        : null;

    // Calculate billing period using the subscription dates from database
    let billingPeriod = null;
    let nextBillingDate = null;

    try {
      if (userData.subscription_start_date && userData.subscription_end_date) {
        billingPeriod = {
          start: userData.subscription_start_date,
          end: userData.subscription_end_date,
        };
        nextBillingDate = userData.subscription_end_date;
      } else if (latestPayment) {
        // Fallback to calculating from the latest payment if subscription dates aren't set
        const paymentDate = new Date(latestPayment.created_at);
        // Assuming a monthly subscription
        nextBillingDate = new Date(paymentDate);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        billingPeriod = {
          start: paymentDate.toISOString(),
          end: nextBillingDate.toISOString(),
        };
      }
    } catch (dateError) {
      console.error("Error calculating billing dates:", dateError);
      // Set default values to avoid error
      billingPeriod = null;
      nextBillingDate = null;
    }

    // Get user credits
    let userCredits = 0;
    try {
      userCredits = await CreditManager.getUserCredits(user.id);
    } catch (creditError) {
      console.error("Error fetching user credits:", creditError);
      // Continue without credits - don't fail the entire request
    }

    // Prepare the user data with subscription status with fallbacks for each field
    const responseData = {
      id: userData.id || user.id,
      email: userData.email || user.email,
      fullName: userData.full_name || "",
      tokenBalance: userData.token_balance || 0,
      totalTokensPurchased: userData.total_tokens_purchased || 0,
      totalVideosProcessed: userData.total_videos_processed || 0,
      subscriptionStatus: subscriptionStatus || "STANDARD",
      subscriptionStartDate: userData.subscription_start_date || null,
      subscriptionEndDate: userData.subscription_end_date || null,
      billingPeriod: billingPeriod || null,
      nextBillingDate:
        nextBillingDate instanceof Date
          ? nextBillingDate.toISOString()
          : nextBillingDate,
      credits: userCredits,
      latestPayment: latestPayment
        ? {
            amount:
              latestPayment.amount_usd ?? latestPayment.payment_amount ?? 0,
            date: latestPayment.created_at ?? new Date().toISOString(),
            status: latestPayment.payment_status ?? "completed",
          }
        : null,
    };

    console.log("Returning subscription data for user:", user.id);
    return NextResponse.json(responseData);
  } catch (error) {
    // Provide more detailed error information
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Server error in subscription route:", errorMessage, error);
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
