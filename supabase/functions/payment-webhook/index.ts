// supabase/functions/payment-webhook/index.ts

// Follow this setup guide to integrate the Supabase Edge Function with your payment provider:
// https://supabase.com/docs/guides/functions

// Note: The TypeScript errors you see in VS Code don't affect the actual function in Supabase
// These are only editor issues since VS Code doesn't understand Deno's URL imports and globals

// @ts-ignore: Deno imports
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore: Deno imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// For VS Code's TypeScript, we'll declare the Deno namespace and other types
declare global {
  namespace Deno {
    interface Env {
      get(key: string): string | undefined;
    }
    export const env: Env;
  }
}

// TypeScript type definitions for our function
interface WebhookRequestPayload {
  user_id: string;
  payment_id: string;
  payment_amount: number;
  subscription_type?: string;
  billing_cycle?: string;
  payment_status?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

// Use explicit type annotation for the request parameter
serve(async (req: Request) => {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify API key for security
    const apiKey = req.headers.get("x-api-key");
    const expectedApiKey = Deno.env.get("WEBHOOK_API_KEY");

    if (expectedApiKey && (!apiKey || apiKey !== expectedApiKey)) {
      console.error("Unauthorized webhook attempt - invalid API key");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get request body
    const data = (await req.json()) as WebhookRequestPayload;

    console.log("Received payment webhook:", JSON.stringify(data));

    // Extract payment data from webhook
    // This structure will vary based on your payment provider (Stripe, PayPal, etc.)
    const {
      user_id,
      payment_id,
      payment_amount,
      subscription_type,
      billing_cycle,
      payment_status,
    } = data;

    // Validate required fields
    if (!user_id) {
      console.error("Missing user_id in payment webhook");
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payment_id) {
      console.error(`Missing payment_id for user ${user_id}`);
      return new Response(JSON.stringify({ error: "Missing payment_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payment_amount) {
      console.error(
        `Missing payment_amount for payment ${payment_id}, user ${user_id}`
      );
      return new Response(JSON.stringify({ error: "Missing payment_amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only process successful payments
    if (payment_status !== "completed" && payment_status !== "succeeded") {
      console.log(
        `Payment ${payment_id} status is ${payment_status}, no action taken`
      );
      return new Response(
        JSON.stringify({
          message: `Payment status is ${payment_status}, no action taken`,
          status: "skipped",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `Processing payment ${payment_id} for user ${user_id}, amount: ${payment_amount}`
    );

    // Check for duplicate payments
    const { data: existingPayment, error: checkError } = await supabaseClient
      .from("payment_subscriptions")
      .select("id")
      .eq("subscription_id", payment_id)
      .maybeSingle();

    if (existingPayment) {
      console.log(`Payment ${payment_id} already processed, skipping`);
      return new Response(
        JSON.stringify({
          message: "Payment already processed",
          status: "already_processed",
          paymentId: existingPayment.id,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine subscription type based on payment amount if not provided
    const paymentSubscriptionType =
      subscription_type || (payment_amount >= 99 ? "BUSINESS" : "PRO");

    // Insert payment into payment_subscriptions table
    const { data: paymentData, error: paymentError } = await supabaseClient
      .from("payment_subscriptions")
      .insert({
        user_id,
        subscription_id: payment_id,
        subscription_type: paymentSubscriptionType,
        payment_amount,
        billing_cycle: billing_cycle || "monthly",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      console.error(`Error recording payment ${payment_id}:`, paymentError);
      return new Response(
        JSON.stringify({ error: "Failed to record payment subscription" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `Successfully recorded payment ${payment_id} with ID ${paymentData?.id}`
    );

    // Determine subscription type and calculate dates
    const subscriptionType =
      subscription_type || (payment_amount >= 99 ? "BUSINESS" : "PRO");
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date(subscriptionStartDate);

    // Calculate end date based on billing cycle
    if (billing_cycle === "yearly" || billing_cycle === "annual") {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
      console.log(
        `Setting yearly subscription until ${subscriptionEndDate.toISOString()}`
      );
    } else if (billing_cycle === "quarterly") {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 3);
      console.log(
        `Setting quarterly subscription until ${subscriptionEndDate.toISOString()}`
      );
    } else {
      // Default to monthly
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      console.log(
        `Setting monthly subscription until ${subscriptionEndDate.toISOString()}`
      );
    }

    // First check if the user exists
    const { data: existingUser, error: userCheckError } = await supabaseClient
      .from("users")
      .select("id")
      .eq("id", user_id)
      .single();

    if (userCheckError) {
      console.error(
        `Error checking if user ${user_id} exists:`,
        userCheckError
      );
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the user's subscription
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .update({
        subscription_type: subscriptionType,
        subscription_start_date: subscriptionStartDate.toISOString(),
        subscription_end_date: subscriptionEndDate.toISOString(),
      })
      .eq("id", user_id)
      .select();

    if (userError) {
      console.error(
        `Error updating subscription for user ${user_id}:`,
        userError
      );

      // The payment was recorded successfully, so continue but log the error
      console.log(
        "Continuing despite user update error - payment was recorded successfully"
      );
    } else {
      console.log(
        `Successfully updated user ${user_id} to ${subscriptionType} subscription`
      );
    }

    // Send notification to your application's webhook endpoint
    try {
      const webhookSecret = Deno.env.get("APP_WEBHOOK_SECRET");
      const appDomain = Deno.env.get("APP_DOMAIN") || "your-app-domain.com";
      const webhookEndpoint =
        Deno.env.get("APP_WEBHOOK_ENDPOINT") ||
        `https://${appDomain}/api/webhooks/supabase-edge`;

      console.log(`Notifying application webhook at: ${webhookEndpoint}`);

      const response = await fetch(webhookEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-supabase-webhook-secret": webhookSecret || "",
        },
        body: JSON.stringify({
          user_id,
          subscription_id: payment_id,
          subscription_type: subscriptionType,
          payment_amount,
          billing_cycle: billing_cycle || "monthly",
          created_at: subscriptionStartDate.toISOString(),
          subscription_end_date: subscriptionEndDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error(
          "Application webhook returned error:",
          response.status,
          responseText
        );
      } else {
        console.log("Application webhook notification successful");
      }
    } catch (webhookError) {
      console.error("Error notifying application webhook:", webhookError);
      // Don't return an error - the subscription was recorded and user updated successfully
    }

    // Return success response with detailed information
    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription updated successfully",
        subscription: {
          id: paymentData?.id,
          type: subscriptionType,
          startDate: subscriptionStartDate.toISOString(),
          endDate: subscriptionEndDate.toISOString(),
        },
        payment: {
          id: payment_id,
          amount: payment_amount,
          billingCycle: billing_cycle || "monthly",
        },
        user: {
          id: user_id,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log detailed error information
    console.error("Error processing payment webhook:", error);

    // Determine error status code
    let statusCode = 500;
    let errorMessage = "Internal server error";

    if (error instanceof Error) {
      if (
        error.message.includes("not found") ||
        error.message.includes("does not exist")
      ) {
        statusCode = 404;
        errorMessage = "Resource not found: " + error.message;
      } else if (
        error.message.includes("permission") ||
        error.message.includes("access")
      ) {
        statusCode = 403;
        errorMessage = "Permission denied: " + error.message;
      } else if (
        error.message.includes("invalid") ||
        error.message.includes("required")
      ) {
        statusCode = 400;
        errorMessage = "Invalid request: " + error.message;
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
        path: req.url,
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
