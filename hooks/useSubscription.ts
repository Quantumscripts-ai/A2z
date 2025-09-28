import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type PlanType = "NA" | "STANDARD" | "PRO" | "BUSINESS" | "CUSTOM";

interface BillingHistoryItem {
  id: string;
  created_at: string;
  amount_usd: number;
  payment_status: string;
  description: string;
  payment_method?: string;
  invoice_url?: string;
}

interface SubscriptionData {
  subscriptionStatus: PlanType;
  nextBillingDate: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  tokenBalance: number;
  totalTokensPurchased: number;
  totalVideosProcessed: number;
  billingHistory?: BillingHistoryItem[];
  credits?: number;
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
        let errorDetails = response.statusText;
        try {
          // Try to get more detailed error from response body
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorDetails = errorData.error;
          }
        } catch (e) {
          // Ignore error parsing JSON
        }
        throw new Error(`Error fetching subscription data: ${errorDetails}`);
      }

      const data = await response.json();

      // Fetch billing history directly from Supabase
      const { data: billingHistory, error: billingError } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (billingError) {
        console.error("Error fetching billing history:", billingError);
      }

      // Set fallback values for any missing fields to prevent errors
      setSubscriptionData({
        subscriptionStatus: data.subscriptionStatus || "NA",
        nextBillingDate: data.nextBillingDate || null,
        subscriptionStartDate: data.subscriptionStartDate || null,
        subscriptionEndDate: data.subscriptionEndDate || null,
        tokenBalance: data.tokenBalance ?? 0,
        totalTokensPurchased: data.totalTokensPurchased ?? 0,
        totalVideosProcessed: data.totalVideosProcessed ?? 0,
        credits: data.credits ?? 0,
        billingHistory: billingHistory || [],
      });
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch subscription"
      );
      console.error("Error fetching subscription:", err);

      // Set default values on error to prevent UI issues
      setSubscriptionData({
        subscriptionStatus: "NA",
        nextBillingDate: null,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        tokenBalance: 0,
        totalTokensPurchased: 0,
        totalVideosProcessed: 0,
        credits: 0,
        billingHistory: [],
      });
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
