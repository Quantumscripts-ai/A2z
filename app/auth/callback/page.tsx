"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          router.push("/auth?error=auth_callback_error");
          return;
        }

        if (data?.session) {
          // Successfully authenticated, ensure user exists in users table
          const userId = data.session.user.id;
          const { data: existingUser, error: existingUserError } =
            await supabase.from("users").select("id").eq("id", userId).single();

          // If user doesn't exist in users table, create a record
          if (existingUserError && existingUserError.code === "PGRST116") {
            const user = data.session.user;
            const { error: createUserError } = await supabase
              .from("users")
              .insert({
                id: user.id,
                email: user.email,
                full_name:
                  user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
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
              console.log(`Created new user record for ${user.id}`);
            }
          }

          // Redirect to workspace or specified redirect URL
          const redirectTo = searchParams.get("redirectTo") || "/workspace";
          router.push(redirectTo);
        } else {
          // No session found, redirect back to auth
          router.push("/auth");
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        router.push("/auth?error=unexpected_error");
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-300 text-lg">Completing authentication...</p>
      </div>
    </div>
  );
}
