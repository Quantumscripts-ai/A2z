import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

/**
 * Utility function to clean up invalid subscription_type values in the users table
 * This should be run once to fix any existing data that has billing cycle info
 * instead of proper plan types in the subscription_type field.
 */
export async function cleanupSubscriptionTypes() {
  console.log("Starting subscription type cleanup...");

  try {
    // First, let's see what subscription_type values currently exist
    const { data: existingTypes, error: queryError } = await supabase
      .from("users")
      .select("subscription_type")
      .not("subscription_type", "in", "(NA,STANDARD,PRO,BUSINESS,CUSTOM)");

    if (queryError) {
      console.error("Error querying existing subscription types:", queryError);
      return { success: false, error: queryError.message };
    }

    console.log("Found invalid subscription types:", existingTypes);

    // Update billing cycle values to proper plan types
    const { error: updateBillingCycleError } = await supabase
      .from("users")
      .update({ subscription_type: "STANDARD" })
      .in("subscription_type", [
        "monthly",
        "yearly",
        "instant",
        "free",
        "FREE",
      ]);

    if (updateBillingCycleError) {
      console.error(
        "Error updating billing cycle values:",
        updateBillingCycleError
      );
      return { success: false, error: updateBillingCycleError.message };
    }

    // Update null or invalid subscription_type to 'NA'
    const { error: updateNullError } = await supabase
      .from("users")
      .update({ subscription_type: "NA" })
      .not("subscription_type", "in", "(NA,STANDARD,PRO,BUSINESS,CUSTOM)");

    if (updateNullError) {
      console.error("Error updating null/invalid values:", updateNullError);
      return { success: false, error: updateNullError.message };
    }

    // Now let's try to determine correct subscription types based on payment history
    const { data: usersWithPayments, error: paymentQueryError } = await supabase
      .from("users")
      .select(
        `
        id, 
        subscription_type,
        payment_transactions!inner(
          payment_amount,
          payment_status,
          created_at
        )
      `
      )
      .eq("subscription_type", "STANDARD")
      .eq("payment_transactions.payment_status", "completed")
      .order("payment_transactions.created_at", { ascending: false });

    if (paymentQueryError) {
      console.error("Error querying users with payments:", paymentQueryError);
      // This is not a critical error, continue
    } else if (usersWithPayments) {
      // Update users based on their payment history
      for (const user of usersWithPayments) {
        const latestPayment = user.payment_transactions[0];
        if (latestPayment) {
          let correctType = "STANDARD";
          if (latestPayment.payment_amount >= 99) {
            correctType = "BUSINESS";
          } else if (latestPayment.payment_amount >= 29) {
            correctType = "PRO";
          }

          if (correctType !== "STANDARD") {
            const { error: updateUserError } = await supabase
              .from("users")
              .update({ subscription_type: correctType })
              .eq("id", user.id);

            if (updateUserError) {
              console.error(`Error updating user ${user.id}:`, updateUserError);
            } else {
              console.log(`Updated user ${user.id} to ${correctType}`);
            }
          }
        }
      }
    }

    console.log("Subscription type cleanup completed successfully");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error during cleanup:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// You can also export a function to validate current subscription types
export async function validateSubscriptionTypes() {
  const { data, error } = await supabase
    .from("users")
    .select("id, subscription_type")
    .not("subscription_type", "in", "(NA,STANDARD,PRO,BUSINESS,CUSTOM)");

  if (error) {
    console.error("Error validating subscription types:", error);
    return { valid: false, error: error.message };
  }

  if (data && data.length > 0) {
    console.log("Found users with invalid subscription types:", data);
    return { valid: false, invalidUsers: data };
  }

  console.log("All subscription types are valid");
  return { valid: true };
}
