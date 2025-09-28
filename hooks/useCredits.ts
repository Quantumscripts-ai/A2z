import { useState, useEffect } from "react";
import { CreditManager, CreditUsage } from "@/lib/creditManager";

interface UseCreditReturn {
  credits: number;
  loading: boolean;
  error: string | null;
  refreshCredits: () => Promise<void>;
  deductCredits: (
    amount: number,
    action?: "video_generation",
    details?: any
  ) => Promise<{ success: boolean; newBalance: number; message?: string }>;
  addCredits: (
    amount: number,
    action?: "purchase" | "bonus" | "refund",
    details?: any
  ) => Promise<number>;
  creditHistory: CreditUsage[];
  loadingHistory: boolean;
  getCreditHistory: () => Promise<void>;
}

export function useCredits(userId: string | undefined): UseCreditReturn {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditHistory, setCreditHistory] = useState<CreditUsage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const refreshCredits = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userCredits = await CreditManager.getUserCredits(userId);
      setCredits(userCredits);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch credits");
      console.error("Error fetching credits:", err);
    } finally {
      setLoading(false);
    }
  };

  const deductCredits = async (
    amount: number,
    action: "video_generation" = "video_generation",
    details?: any
  ): Promise<{ success: boolean; newBalance: number; message?: string }> => {
    if (!userId) {
      return {
        success: false,
        newBalance: credits,
        message: "User not authenticated",
      };
    }

    try {
      const result = await CreditManager.deductCredits(
        userId,
        amount,
        action,
        details
      );
      if (result.success) {
        setCredits(result.newBalance);
      }
      return result;
    } catch (err) {
      console.error("Error deducting credits:", err);
      return {
        success: false,
        newBalance: credits,
        message:
          err instanceof Error ? err.message : "Failed to deduct credits",
      };
    }
  };

  const addCredits = async (
    amount: number,
    action: "purchase" | "bonus" | "refund" = "purchase",
    details?: any
  ): Promise<number> => {
    if (!userId) {
      throw new Error("User not authenticated");
    }

    try {
      const newBalance = await CreditManager.addCredits(
        userId,
        amount,
        action,
        details
      );
      setCredits(newBalance);
      return newBalance;
    } catch (err) {
      console.error("Error adding credits:", err);
      throw err;
    }
  };

  const getCreditHistory = async () => {
    if (!userId) return;

    try {
      setLoadingHistory(true);
      const history = await CreditManager.getCreditUsageHistory(userId);
      setCreditHistory(history);
    } catch (err) {
      console.error("Error fetching credit history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshCredits();
  }, [userId]);

  return {
    credits,
    loading,
    error,
    refreshCredits,
    deductCredits,
    addCredits,
    creditHistory,
    loadingHistory,
    getCreditHistory,
  };
}
