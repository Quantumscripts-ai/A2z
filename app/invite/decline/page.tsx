"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { declineTeamInvitation } from "@/lib/teamCollaboration";
import { useTheme } from "@/contexts/ThemeContext";

const InviteDeclinePage = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [loading, setLoading] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeclineInvitation = async () => {
    if (!token) {
      setError("Invalid invitation link");
      return;
    }

    setLoading(true);
    try {
      const response = await declineTeamInvitation(token);
      if (response.success) {
        setDeclined(true);
      } else {
        setError(response.error || "Failed to decline invitation");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
    }
  }, [token]);

  if (!token || error) {
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
              {error || "This invitation link is invalid or has expired."}
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

  if (declined) {
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
            <div className="text-6xl mb-4">✅</div>
            <h1
              className={`text-2xl font-bold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Invitation Declined
            </h1>
            <p className={`${isDark ? "text-gray-400" : "text-gray-600"} mb-6`}>
              You have successfully declined the team invitation. The team admin
              has been notified.
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
        className={`max-w-lg w-full mx-4 p-8 rounded-xl shadow-lg ${
          isDark ? "bg-gray-900" : "bg-white"
        }`}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">🤔</div>
          <h1
            className={`text-2xl font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Decline Team Invitation
          </h1>
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"} mb-8`}>
            Are you sure you want to decline this team invitation? You can
            always join the team later if you change your mind.
          </p>

          <div className="space-y-4">
            <button
              onClick={handleDeclineInvitation}
              disabled={loading}
              className={`w-full px-6 py-3 rounded-lg transition-colors font-medium ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              } text-white`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Declining...
                </div>
              ) : (
                "Yes, Decline Invitation"
              )}
            </button>

            <button
              onClick={() => router.push("/")}
              className={`w-full px-6 py-3 rounded-lg transition-colors font-medium ${
                isDark
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
              }`}
            >
              Go to Homepage
            </button>
          </div>

          <div
            className={`mt-8 p-4 rounded-lg ${
              isDark ? "bg-gray-800" : "bg-gray-100"
            }`}
          >
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              💡 <strong>Tip:</strong> If you&apos;re not ready to join now but
              might be interested later, you can decline this invitation and ask
              the team admin to send a new one when you&apos;re ready.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteDeclinePage;
