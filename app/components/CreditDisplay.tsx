"use client";

import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

interface CreditDisplayProps {
  showLabel?: boolean;
  className?: string;
}

const CreditDisplay = ({
  showLabel = true,
  className = "",
}: CreditDisplayProps) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { credits, loading, error } = useCredits(user?.id);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div
          className={`h-6 w-20 rounded ${
            isDark ? "bg-gray-700" : "bg-gray-200"
          }`}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-500 text-sm ${className}`}>
        Error loading credits
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 ${className} ${
        isDark ? "text-gray-300" : "text-gray-700"
      }`}
    >
      <svg
        className="w-4 h-4 text-purple-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
        />
      </svg>
      <span
        className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
      >
        {credits}
        {showLabel && " Credits"}
      </span>
    </div>
  );
};

export default CreditDisplay;
