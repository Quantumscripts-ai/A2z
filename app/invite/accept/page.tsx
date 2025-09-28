"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  acceptTeamInvitation,
  declineTeamInvitation,
} from "@/lib/teamCollaboration";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const InviteAcceptPage = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  }>({});

  useEffect(() => {
    if (!token) {
      setResult({ error: "Invalid invitation link" });
      return;
    }

    if (!user) {
      // Redirect to login with return URL
      const returnUrl = `/invite/accept?token=${token}`;
      router.push(`/auth?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // Auto-accept the invitation when user is authenticated
    handleAcceptInvitation();
  }, [token, user]);

  const handleAcceptInvitation = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await acceptTeamInvitation(token);
      if (response.success) {
        setResult({
          success: true,
          message:
            "🎉 Successfully joined the team! Redirecting to your workspace...",
        });

        // Redirect to workspace after 3 seconds
        setTimeout(() => {
          router.push("/workspace");
        }, 3000);
      } else {
        setResult({ error: response.error || "Failed to accept invitation" });
      }
    } catch (error) {
      setResult({ error: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? "bg-black" : "bg-gray-50"
        }`}
      >
        <div
          className={`max-w-md w-full mx-4 p-8 rounded-xl shadow-lg ${
            isDark ? "bg-gray-900" : "bg-white"
          }`}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1
              className={`text-2xl font-bold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Invalid Invitation
            </h1>
            <p className={`${isDark ? "text-gray-400" : "text-gray-600"} mb-6`}>
              This invitation link is invalid or has expired.
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        isDark ? "bg-black" : "bg-gray-50"
      }`}
    >
      <div
        className={`max-w-md w-full mx-4 p-8 rounded-xl shadow-lg ${
          isDark ? "bg-gray-900" : "bg-white"
        }`}
      >
        <div className="text-center">
          {loading ? (
            <>
              <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h1
                className={`text-2xl font-bold mb-4 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Processing Invitation...
              </h1>
              <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Please wait while we add you to the team.
              </p>
            </>
          ) : result.success ? (
            <>
              <div className="text-6xl mb-4">🎉</div>
              <h1
                className={`text-2xl font-bold mb-4 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Welcome to the Team!
              </h1>
              <p
                className={`${isDark ? "text-gray-400" : "text-gray-600"} mb-6`}
              >
                {result.message}
              </p>
              <div className="animate-pulse">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p
                  className={`mt-2 text-sm ${
                    isDark ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  Redirecting to workspace...
                </p>
              </div>
            </>
          ) : result.error ? (
            <>
              <div className="text-6xl mb-4">⚠️</div>
              <h1
                className={`text-2xl font-bold mb-4 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Invitation Error
              </h1>
              <p
                className={`${isDark ? "text-gray-400" : "text-gray-600"} mb-6`}
              >
                {result.error}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/auth")}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push("/")}
                  className={`w-full px-6 py-3 rounded-lg transition-colors ${
                    isDark
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                  }`}
                >
                  Go to Homepage
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">📨</div>
              <h1
                className={`text-2xl font-bold mb-4 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Preparing Invitation...
              </h1>
              <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Please wait while we process your invitation.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteAcceptPage;
