"use client";

import { useCredits } from "@/hooks/useCredits";
import { useTheme } from "@/contexts/ThemeContext";

interface CreditBadgeProps {
  userId: string | undefined;
  className?: string;
}

const CreditBadge = ({ userId, className = "" }: CreditBadgeProps) => {
  const { isDark } = useTheme();
  const { credits, loading, error } = useCredits(userId);

  if (loading) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
        } ${className}`}
      >
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        Loading...
      </div>
    );
  }

  if (error || !userId) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          isDark ? "bg-red-900/20 text-red-400" : "bg-red-100 text-red-600"
        } ${className}`}
      >
        ⚠️ Error loading credits
      </div>
    );
  }

  const getCreditColor = (creditAmount: number) => {
    if (creditAmount >= 50) {
      return isDark
        ? "bg-green-900/20 text-green-400"
        : "bg-green-100 text-green-700";
    } else if (creditAmount >= 20) {
      return isDark
        ? "bg-yellow-900/20 text-yellow-400"
        : "bg-yellow-100 text-yellow-700";
    } else {
      return isDark ? "bg-red-900/20 text-red-400" : "bg-red-100 text-red-600";
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 ${getCreditColor(
        credits
      )} ${className}`}
    >
      <span className="text-lg">💳</span>
      <span>{credits} credits</span>
    </div>
  );
};

export default CreditBadge;
