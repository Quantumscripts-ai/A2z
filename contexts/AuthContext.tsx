"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Redirect to home page when user signs out
      if (event === "SIGNED_OUT") {
        // Clear any cached data
        localStorage.clear();
        // Redirect to home page
        router.push("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const signOut = async () => {
    try {
      // Clear any app-specific data before signing out
      localStorage.clear();

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Sign out error:", error);
        throw error;
      }

      // Redirect will be handled by the auth state change listener
      router.push("/");
    } catch (error) {
      console.error("Error during sign out:", error);
      // Still redirect even if there's an error
      router.push("/");
    }
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
