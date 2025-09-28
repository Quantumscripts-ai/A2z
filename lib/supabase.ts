import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Auth helper functions
export const signUp = async (
  email: string,
  password: string,
  fullName?: string
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  // If sign-up is successful, create a user in the users table
  if (data?.user) {
    // Create user record in users table
    const { error: createUserError } = await supabase.from("users").insert({
      id: data.user.id,
      email: data.user.email,
      full_name: fullName || "",
      subscription_type: "NA",
      token_balance: 0,
      total_tokens_purchased: 0,
      total_videos_processed: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (createUserError) {
      console.error(
        "Error creating user record after signup:",
        createUserError
      );
    } else {
      console.log(`Created new user record for ${data.user.id} after signup`);
    }
  }

  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // If sign-in is successful, ensure user exists in the users table
  if (data?.user) {
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("id")
      .eq("id", data.user.id)
      .single();

    // If user doesn't exist in users table, create a record
    if (existingUserError && existingUserError.code === "PGRST116") {
      const { error: createUserError } = await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email,
        full_name:
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          "",
        subscription_type: "NA",
        token_balance: 0,
        total_tokens_purchased: 0,
        total_videos_processed: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (createUserError) {
        console.error("Error creating user record:", createUserError);
      } else {
        console.log(`Created new user record for ${data.user.id}`);
      }
    }
  }

  return { data, error };
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  // Note: For OAuth, user record creation happens in the auth callback page
  // because this function doesn't have access to the user data yet

  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
};

// Fetch user profile data from the users table
export const getUserProfile = async (userId: string) => {
  try {
    // Get the basic user profile data
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    // If user doesn't exist in the users table, get auth data and create record
    if (error && error.code === "PGRST116") {
      console.log(
        "User profile not found, checking auth user and creating record"
      );

      // Get user details from auth
      const { data: authUser, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authUser.user) {
        console.error("Error fetching auth user:", authError?.message);
        return { data: null, error: "User not authenticated" };
      }

      // Create new user record in users table
      const newUserData = {
        id: authUser.user.id,
        email: authUser.user.email,
        full_name:
          authUser.user.user_metadata?.full_name ||
          authUser.user.user_metadata?.name ||
          "",
        subscription_type: "NA",
        token_balance: 0,
        total_tokens_purchased: 0,
        total_videos_processed: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from("users")
        .insert(newUserData);

      if (insertError) {
        console.error("Error creating user profile:", insertError.message);
        return { data: null, error: "Failed to create user profile" };
      }

      console.log(`Created new user record for ${userId}`);
      return { data: newUserData, error: null };
    }

    if (error) {
      console.error("Error fetching user profile:", error.message);
      return { data: null, error: error.message };
    }

    // If no data is found, handle that specifically
    if (!data) {
      return { data: null, error: "User not found" };
    }

    // Check for subscription status in payment_subscriptions table
    const { data: subscriptionDataArray, error: subscriptionError } =
      await supabase
        .from("payment_subscriptions")
        .select("subscription_type, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

    // Get the first item if available
    const subscriptionData =
      subscriptionDataArray && subscriptionDataArray.length > 0
        ? subscriptionDataArray[0]
        : null;

    // If we found a subscription and it's more recent than the user's subscription_start_date,
    // use its subscription_type instead
    if (subscriptionData && !subscriptionError) {
      const subscriptionCreatedAt = new Date(subscriptionData.created_at);
      const userSubStartDate = data.subscription_start_date
        ? new Date(data.subscription_start_date)
        : null;

      if (!userSubStartDate || subscriptionCreatedAt > userSubStartDate) {
        data.subscription_type = subscriptionData.subscription_type;
      }
    }

    return { data, error: null };
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return { data: null, error: "Failed to fetch user profile data" };
  }
};
