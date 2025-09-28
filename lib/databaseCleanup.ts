// Database cleanup utility for credits table
import { supabaseAdmin } from "./supabaseAdmin";

export class DatabaseCleanup {
  /**
   * Clean up duplicate credit entries and ensure only one record per user
   */
  static async cleanupCreditDuplicates(): Promise<{
    success: boolean;
    message: string;
    duplicatesRemoved?: number;
  }> {
    try {
      // First, find all duplicate entries
      const { data: allCredits, error: fetchError } = await supabaseAdmin
        .from("credits")
        .select("id, user_id, balance, updated_at")
        .order("user_id")
        .order("updated_at", { ascending: false }); // Most recent first

      if (fetchError) {
        throw fetchError;
      }

      if (!allCredits || allCredits.length === 0) {
        return {
          success: true,
          message: "No credit records found",
        };
      }

      // Group by user_id and find duplicates
      const userGroups: {
        [userId: string]: Array<{
          id: string;
          user_id: string;
          balance: number;
          updated_at: string;
        }>;
      } = {};
      allCredits.forEach((credit) => {
        if (!userGroups[credit.user_id]) {
          userGroups[credit.user_id] = [];
        }
        userGroups[credit.user_id].push(credit);
      });

      let duplicatesRemoved = 0;

      // For each user, keep the most recent record and remove others
      for (const userId in userGroups) {
        const userCredits = userGroups[userId];

        if (userCredits.length > 1) {
          // Keep the first one (most recent) and delete the rest
          const toKeep = userCredits[0];
          const toDelete = userCredits.slice(1);

          console.log(
            `User ${userId} has ${userCredits.length} credit records. Keeping most recent with balance ${toKeep.balance}`
          );

          // Delete duplicate records
          for (const duplicate of toDelete) {
            const { error: deleteError } = await supabaseAdmin
              .from("credits")
              .delete()
              .eq("id", duplicate.id);

            if (deleteError) {
              console.error(
                `Error deleting duplicate credit record ${duplicate.id}:`,
                deleteError
              );
            } else {
              duplicatesRemoved++;
            }
          }
        }
      }

      return {
        success: true,
        message: `Cleanup completed. ${duplicatesRemoved} duplicate records removed.`,
        duplicatesRemoved,
      };
    } catch (error) {
      console.error("Error during credit cleanup:", error);
      return {
        success: false,
        message: `Cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Initialize credits for all users who don't have credit records
   */
  static async initializeAllUserCredits(): Promise<{
    success: boolean;
    message: string;
    usersInitialized?: number;
  }> {
    try {
      // Get all users
      const { data: users, error: usersError } = await supabaseAdmin
        .from("users")
        .select("id");

      if (usersError) {
        throw usersError;
      }

      if (!users || users.length === 0) {
        return {
          success: true,
          message: "No users found",
        };
      }

      // Get all existing credit records
      const { data: existingCredits, error: creditsError } = await supabaseAdmin
        .from("credits")
        .select("user_id");

      if (creditsError) {
        throw creditsError;
      }

      const existingUserIds = new Set(
        existingCredits?.map((c) => c.user_id) || []
      );

      // Find users without credit records
      const usersWithoutCredits = users.filter(
        (user) => !existingUserIds.has(user.id)
      );

      let usersInitialized = 0;

      // Initialize credits for users who don't have them
      for (const user of usersWithoutCredits) {
        const { error: insertError } = await supabaseAdmin
          .from("credits")
          .insert({
            user_id: user.id,
            balance: 0,
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error(
            `Error initializing credits for user ${user.id}:`,
            insertError
          );
        } else {
          usersInitialized++;
        }
      }

      return {
        success: true,
        message: `Initialization completed. ${usersInitialized} users initialized with credit records.`,
        usersInitialized,
      };
    } catch (error) {
      console.error("Error during user credit initialization:", error);
      return {
        success: false,
        message: `Initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }
}
