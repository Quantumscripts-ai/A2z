# Subscription Management System

This document outlines how the subscription system is implemented in the TranslateA2Z application.

## Database Structure

### Users Table

The users table includes the following subscription-related fields:

- `subscription_type`: Either "FREE", "PRO", or "BUSINESS"
- `subscription_start_date`: When the current subscription started
- `subscription_end_date`: When the current subscription will expire

### Payment Transactions Table

Payment transactions are recorded in the `payment_transactions` table with:

- `id`: Unique identifier
- `user_id`: Reference to the user making the payment
- `amount_usd`: Payment amount in USD
- `payment_id`: External payment processor ID
- `payment_status`: Status of payment (e.g., "completed", "failed", "pending")
- `created_at`: When the transaction was initiated
- `completed_at`: When the transaction was completed

## API Endpoints

### `/api/user/subscription`

GET endpoint that returns the current user's subscription details. This endpoint checks both the `users` table and the `payment_subscriptions` table to ensure the most up-to-date subscription status.

### `/api/webhooks/payment`

POST endpoint that processes webhooks from your payment gateway. Updates user subscription based on payment details.

### `/api/webhooks/supabase-edge`

POST endpoint that receives notifications from Supabase Edge Functions when a payment is made. Updates the UI to reflect the new subscription status.

Implementation:

```typescript
// app/api/webhooks/supabase-edge/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
    } = paymentData;

    if (!user_id || !subscription_id) {
      console.error("Missing required fields in payment data");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine subscription plan type (PRO/BUSINESS)
    let planType = "PRO"; // Default to PRO
    if (subscription_type) {
      planType = subscription_type.toUpperCase();
    } else if (payment_amount >= 99) {
      planType = "BUSINESS";
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

    console.log(`Updating user ${user_id} to ${planType} subscription`);

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

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Subscription updated successfully",
      user_id,
      subscription_type: planType,
      subscription_start: subscriptionStartDate,
      subscription_end: subscriptionEndDate,
    });
  } catch (error) {
    console.error("Error processing subscription update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### `/api/admin/update-subscription`

POST endpoint for administrators to manually update a user's subscription.

## Supabase Edge Function

A Supabase Edge Function (`payment-webhook`) has been implemented to handle payment notifications from the payment gateway. When a payment is processed, the Edge Function:

1. Records the payment in the `payment_subscriptions` table
2. Updates the user's subscription type in the `users` table
3. Notifies our application via the `/api/webhooks/supabase-edge` endpoint to update the UI

### Edge Function Implementation

The Supabase Edge Function is already implemented at `supabase/functions/payment-webhook/index.ts`:

```typescript
// supabase/functions/payment-webhook/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get request body
    const data = await req.json();

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
    if (!user_id || !payment_id || !payment_amount) {
      return new Response(
        JSON.stringify({ error: "Missing required payment information" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Only process successful payments
    if (payment_status !== "completed" && payment_status !== "succeeded") {
      return new Response(
        JSON.stringify({ message: "Payment not completed, no action taken" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Insert payment into payment_subscriptions table
    const { data: paymentData, error: paymentError } = await supabaseClient
      .from("payment_subscriptions")
      .insert({
        user_id,
        subscription_id: payment_id,
        subscription_type:
          subscription_type || (payment_amount >= 99 ? "BUSINESS" : "PRO"),
        payment_amount,
        billing_cycle: billing_cycle || "monthly",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error recording payment subscription:", paymentError);
      return new Response(
        JSON.stringify({ error: "Failed to record payment subscription" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update user's subscription status
    const subscriptionType =
      subscription_type || (payment_amount >= 99 ? "BUSINESS" : "PRO");
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date(subscriptionStartDate);

    if (billing_cycle === "yearly") {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    }

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
      console.error("Error updating user subscription:", userError);
      // Don't return an error - the payment was recorded successfully
    }

    // Send notification to your application's webhook endpoint
    try {
      const webhookSecret = Deno.env.get("APP_WEBHOOK_SECRET");
      const webhookEndpoint =
        Deno.env.get("APP_WEBHOOK_ENDPOINT") ||
        "https://your-app-domain.com/api/webhooks/supabase-edge";

      await fetch(webhookEndpoint, {
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
    } catch (webhookError) {
      console.error("Error notifying application webhook:", webhookError);
      // Don't return an error - the subscription was updated successfully
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription updated successfully",
        subscription: {
          id: paymentData?.id,
          type: subscriptionType,
          startDate: subscriptionStartDate,
          endDate: subscriptionEndDate,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing payment webhook:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

````

## Implementation Steps

1. Run the migration script in `migrations/add_subscription_type_to_users.sql` to add subscription fields to your database

2. Create the `payment_subscriptions` table to track payments from your payment gateway:

   ```sql
   CREATE TABLE payment_subscriptions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     subscription_id VARCHAR(255) NOT NULL,
     subscription_type VARCHAR(20) NOT NULL,
     payment_amount NUMERIC(10, 2) NOT NULL,
     billing_cycle VARCHAR(20) NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
   );
````

3. Deploy the Supabase Edge Function from `supabase/functions/payment-webhook/index.ts`:

   ```bash
   supabase functions deploy payment-webhook
   ```

4. Configure your payment gateway to send webhooks to your Supabase Edge Function URL:

   ```
   https://your-project-ref.supabase.co/functions/v1/payment-webhook
   ```

5. Update the payment gateway URL in the billing page to include user and plan information:

   ```typescript
   const PAYMENT_GATEWAY_URL = "https://your-payment-gateway.com/TranslateA2Z";
   ```

6. To test the subscription system, use the admin API endpoint:
   ```bash
   curl -X POST http://your-domain.com/api/admin/update-subscription \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -d '{"userId": "user-uuid", "subscriptionType": "PRO", "durationMonths": 1}'
   ```

## Subscription Lifecycle

1. User selects a plan and is redirected to the payment gateway
2. Upon successful payment, the payment gateway sends a webhook to the Supabase Edge Function
3. The Edge Function:
   - Creates a payment record in the `payment_subscriptions` table
   - Updates the user's subscription in the `users` table
   - Notifies the application via the webhook endpoint
4. The `useSubscription` hook in the UI detects the change and updates the display in real-time
5. A database trigger or background job checks for expired subscriptions and downgrades them to FREE

### Real-time Subscription Updates

The application uses a custom `useSubscription` hook that:

1. Subscribes to changes in the `payment_subscriptions` table for the current user
2. Polls the API endpoint periodically as a fallback
3. Updates the UI automatically when a subscription change is detected

#### useSubscription Hook Implementation

The hook is already implemented at `hooks/useSubscription.ts`:

```typescript
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type PlanType = "FREE" | "PRO" | "BUSINESS";

interface SubscriptionData {
  subscriptionStatus: PlanType;
  nextBillingDate: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  tokenBalance: number;
  totalTokensPurchased: number;
  totalVideosProcessed: number;
}

export function useSubscription(userId: string | undefined) {
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("No active session");
        setIsLoading(false);
        return;
      }

      // Fetch subscription data from API
      const response = await fetch("/api/user/subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Error fetching subscription data: ${response.statusText}`
        );
      }

      const data = await response.json();
      setSubscriptionData({
        subscriptionStatus: data.subscriptionStatus,
        nextBillingDate: data.nextBillingDate,
        subscriptionStartDate: data.subscriptionStartDate,
        subscriptionEndDate: data.subscriptionEndDate,
        tokenBalance: data.tokenBalance,
        totalTokensPurchased: data.totalTokensPurchased,
        totalVideosProcessed: data.totalVideosProcessed,
      });
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch subscription"
      );
      console.error("Error fetching subscription:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSubscription();
  }, [userId]);

  // Set up subscription to payment_subscriptions table
  useEffect(() => {
    if (!userId) return;

    // Subscribe to changes in the payment_subscriptions table for this user
    const subscription = supabase
      .channel("payment_subscriptions_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "payment_subscriptions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("New subscription detected:", payload);
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  // Poll for subscription updates every minute
  // This is a fallback in case the realtime subscription doesn't work
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      fetchSubscription();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [userId]);

  return { subscriptionData, isLoading, error, refetch: fetchSubscription };
}
```

To use this hook in a component:

```typescript
import { useSubscription } from "@/hooks/useSubscription";
import { useUser } from "@supabase/auth-helpers-react";

const BillingPage = () => {
  const user = useUser();
  const { subscriptionData, isLoading, error } = useSubscription(user?.id);

  if (isLoading) return <div>Loading subscription details...</div>;
  if (error) return <div>Error loading subscription: {error}</div>;

  return (
    <div>
      <h2>
        Your Current Plan: {subscriptionData?.subscriptionStatus || "FREE"}
      </h2>
      {/* Display subscription details */}
    </div>
  );
};
```

## Displaying Subscription Status

The billing page in `/app/workspace/billing/page.tsx` displays:

- Current plan and features
- Subscription period
- Usage statistics
- Available plans for upgrade/downgrade

## Testing

### Testing the Full Subscription Flow

1. **Deploy the Supabase Edge Function:**

   ```bash
   supabase functions deploy payment-webhook
   ```

2. **Set the required environment variables:**

   ```bash
   supabase secrets set SUPABASE_URL=https://your-project-ref.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   supabase secrets set APP_WEBHOOK_SECRET=your-webhook-secret
   supabase secrets set APP_WEBHOOK_ENDPOINT=https://your-app.com/api/webhooks/supabase-edge
   ```

3. **Simulate a Payment Webhook:**

   You can simulate a payment webhook by sending a POST request to your Edge Function:

   ```bash
   curl -X POST "https://your-project-ref.supabase.co/functions/v1/payment-webhook" \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "user-uuid",
       "payment_id": "test-payment-123",
       "payment_amount": 49,
       "subscription_type": "PRO",
       "billing_cycle": "monthly",
       "payment_status": "completed"
     }'
   ```

4. **Verify the Subscription Update:**

   - Check the `payment_subscriptions` table for a new record
   - Verify that the user's subscription was updated in the `users` table
   - Confirm that the UI reflects the new subscription status in real-time

### Testing via Admin API

To test different subscription types without processing a payment, use the admin API endpoint to update a user's subscription manually:

```bash
curl -X POST "https://your-app-domain.com/api/admin/update-subscription" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "userId": "user-uuid",
    "subscriptionType": "PRO",
    "durationMonths": 1
  }'
```

## Monitoring and Troubleshooting

### Subscription Monitoring

Monitor subscription activity using the Supabase dashboard or by querying the database directly:

```sql
-- Get all active subscriptions
SELECT
  u.email,
  u.subscription_type,
  u.subscription_start_date,
  u.subscription_end_date
FROM users u
WHERE u.subscription_type != 'FREE'
ORDER BY u.subscription_end_date;

-- Get recent payment activity
SELECT
  ps.created_at,
  ps.user_id,
  ps.subscription_type,
  ps.payment_amount,
  u.email
FROM payment_subscriptions ps
JOIN users u ON ps.user_id = u.id
ORDER BY ps.created_at DESC
LIMIT 20;
```

### Common Issues and Solutions

1. **Subscription Not Updating in UI:**

   - Check if the Supabase realtime subscription is working
   - Verify the webhook endpoint is being called
   - Check browser console for errors in the useSubscription hook

2. **Payment Recorded but User Status Not Updated:**

   - Check the users table update logic in the Edge Function
   - Verify the subscription start/end dates are calculated correctly
   - Ensure user permissions are set up correctly in Supabase

3. **Edge Function Not Receiving Webhooks:**
   - Verify your payment provider is sending webhooks to the correct URL
   - Check Edge Function logs for errors
   - Test the Edge Function directly using curl

## Conclusion

This subscription system provides a complete solution for handling subscriptions in TranslateA2Z. It includes:

1. **Real-time Updates:** Using Supabase's realtime features to update the UI immediately when payments are processed
2. **Redundant Updates:** Both database triggers and API polling ensure subscription changes are reflected
3. **Secure Processing:** Payment details are handled securely through the Supabase Edge Function
4. **User Experience:** Clear subscription status display in the billing page
5. **Admin Controls:** API endpoints for administrators to manage user subscriptions

By following this implementation, you can provide users with a seamless subscription experience while ensuring reliable tracking and updates of subscription status throughout the application.
