import { supabase } from "./supabase";

export interface CreditBalance {
  balance: number;
  user_id: string;
}

export interface CreditUsage {
  id?: string;
  user_id: string;
  amount: number;
  action: "video_generation" | "purchase" | "refund" | "bonus";
  used_at?: string;
  details?: Record<string, unknown>;
}

export class CreditManager {
  static async getUserCredits(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      // If no record exists, create one with 0 balance
      if (!data) {
        await this.ensureUserCreditsExist(userId);
        return 0;
      }

      return data.balance || 0;
    } catch (error) {
      console.error("Error getting user credits:", error);
      throw error;
    }
  }

  static async ensureUserCreditsExist(userId: string): Promise<void> {
    try {
      // Use upsert with ON CONFLICT DO NOTHING to avoid duplicate key errors
      const { error } = await supabase.from("credits").upsert(
        {
          user_id: userId,
          balance: 0,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
          ignoreDuplicates: true, // This will ignore if exists, only insert if new
        }
      );

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error ensuring user credits exist:", error);
      // Don't throw here, as this is just ensuring the record exists
    }
  }

  static async initializeUserCredits(userId: string): Promise<void> {
    try {
      // Use upsert to either insert new record or update existing one
      const { error } = await supabase.from("credits").upsert(
        {
          user_id: userId,
          balance: 0,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
          ignoreDuplicates: false, // This will update if exists
        }
      );

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error initializing user credits:", error);
      throw error;
    }
  }

  static async addCredits(
    userId: string,
    amount: number,
    action: "purchase" | "bonus" | "refund" = "purchase",
    details?: Record<string, unknown>
  ): Promise<number> {
    try {
      // Start a transaction
      const { data: currentCredits, error: fetchError } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      let currentBalance = 0;
      if (!currentCredits) {
        // Ensure credit record exists
        await this.ensureUserCreditsExist(userId);
      } else {
        currentBalance = currentCredits.balance || 0;
      }

      const newBalance = currentBalance + amount;

      // Update credits balance
      const { error: updateError } = await supabase.from("credits").upsert(
        {
          user_id: userId,
          balance: newBalance,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
          ignoreDuplicates: false, // Always update the balance
        }
      );

      if (updateError) {
        throw updateError;
      }

      // Record the credit usage
      await this.recordCreditUsage(userId, amount, action, details);

      return newBalance;
    } catch (error) {
      console.error("Error adding credits:", error);
      throw error;
    }
  }

  static async deductCredits(
    userId: string,
    amount: number,
    action: "video_generation" = "video_generation",
    details?: Record<string, unknown>
  ): Promise<{ success: boolean; newBalance: number; message?: string }> {
    try {
      const currentBalance = await this.getUserCredits(userId);

      if (currentBalance < amount) {
        return {
          success: false,
          newBalance: currentBalance,
          message: `Insufficient credits. You have ${currentBalance} credits but need ${amount}.`,
        };
      }

      const newBalance = currentBalance - amount;

      // Update credits balance
      const { error: updateError } = await supabase
        .from("credits")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        throw updateError;
      }

      // Record the credit usage (negative amount for deduction)
      await this.recordCreditUsage(userId, -amount, action, details);

      return {
        success: true,
        newBalance,
      };
    } catch (error) {
      console.error("Error deducting credits:", error);
      throw error;
    }
  }

  static async recordCreditUsage(
    userId: string,
    amount: number,
    action: "video_generation" | "purchase" | "refund" | "bonus",
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      const { error } = await supabase.from("credit_usage").insert({
        user_id: userId,
        amount: amount,
        action: action,
        used_at: new Date().toISOString(),
        details: details,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error recording credit usage:", error);
      throw error;
    }
  }

  static async getCreditUsageHistory(
    userId: string,
    limit = 50
  ): Promise<CreditUsage[]> {
    try {
      const { data, error } = await supabase
        .from("credit_usage")
        .select("*")
        .eq("user_id", userId)
        .order("used_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error getting credit usage history:", error);
      throw error;
    }
  }

  static calculateVideoCredits(durationInMinutes: number): number {
    // 1 minute = 1 credit, rounded up to nearest minute
    return Math.ceil(durationInMinutes);
  }

  static getCreditsForPlan(
    planType: "NA" | "STANDARD" | "PRO" | "BUSINESS" | "CUSTOM"
  ): number {
    const plans = {
      NA: 0,
      STANDARD: 100,
      PRO: 250,
      BUSINESS: 600,
      CUSTOM: 0, // Custom plans have variable credits
    };

    return plans[planType] || 0;
  }
}
