"use client";

import { useEffect, useState } from "react";
import { getUserProfile, supabase } from "@/lib/supabase";
import { useTheme } from "@/contexts/ThemeContext";
import { AlertCircle, Wallet, ShoppingCart, Video, Clock } from "lucide-react";
import Image from "next/image";
import UserVideosList from "./UserVideosList";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  token_balance: number;
  total_tokens_purchased: number;
  total_videos_processed: number;
  created_at: string;
  updated_at: string;
}

interface UserProfileCardProps {
  userId: string;
}

const UserProfileCard = ({ userId }: UserProfileCardProps) => {
  const { isDark } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [processedVideosCount, setProcessedVideosCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [profileData, videosData] = await Promise.all([
          getUserProfile(userId),
          supabase
            .from("videos")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("status", "completed"),
        ]);

        // Set processed videos count
        setProcessedVideosCount(videosData.count || 0);

        // Handle profile data
        const { data, error } = profileData;

        if (error) {
          setError("Failed to load profile data");
          console.error(
            "Profile fetch error:",
            typeof error === "string" ? error : JSON.stringify(error)
          );
        } else if (!data) {
          setError("No profile data found");
          console.error("Error fetching user profile: No data found");
        } else {
          setProfile(data);
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error(
          "Error in fetchProfile:",
          err instanceof Error ? err.message : String(err)
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading) {
    return (
      <div
        className={`rounded-3xl border p-8 ${
          isDark
            ? "bg-purple-900/20 border-purple-700"
            : "bg-purple-50 border-purple-300"
        }`}
      >
        <div className="text-center space-y-4">
          <div className="text-6xl">⏳</div>
          <h3
            className={`text-xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Loading Profile...
          </h3>
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>
            User ID: {userId}
          </p>
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-3xl border p-8 text-center ${
          isDark
            ? "bg-red-900/20 border-red-800 text-red-200"
            : "bg-red-50 border-red-200 text-red-600"
        }`}
      >
        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">{error}</p>
        <p className="text-sm opacity-75 mt-1">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        className={`rounded-3xl border p-8 text-center ${
          isDark
            ? "bg-red-900/20 border-red-700 text-red-300"
            : "bg-red-50 border-red-300 text-red-700"
        }`}
      >
        <div className="space-y-4">
          <div className="text-6xl">🚫</div>
          <h3 className="text-xl font-bold">No Profile Data Found</h3>
          <p>User ID: {userId}</p>
          <p className="text-sm opacity-75">
            The user profile could not be found in the database. Please ensure
            you have a record in the &apos;users&apos; table.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${
        isDark
          ? "bg-black/50 border-gray-800 hover:border-purple-500/30"
          : "bg-white/50 border-gray-200 hover:border-purple-300/50"
      }`}
    >
      {/* Header Section */}
      <div
        className={`p-8 border-b ${
          isDark ? "border-gray-800/50" : "border-gray-200/50"
        }`}
      >
        <div className="flex items-center space-x-6">
          {/* Avatar */}
          <div className="relative">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover border-2 border-purple-500/30"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {profile.full_name?.[0]?.toUpperCase() ||
                  profile.email?.[0]?.toUpperCase() ||
                  "U"}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-black"></div>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h3
              className={`text-2xl font-bold mb-1 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {profile.full_name || "User"}
            </h3>
            <p
              className={`text-lg ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {profile.email}
            </p>
            <p
              className={`text-sm mt-2 ${
                isDark ? "text-gray-500" : "text-gray-500"
              }`}
            >
              Member since {formatDate(profile.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="p-8">
        <h4
          className={`text-lg font-semibold mb-6 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Account Statistics
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Token Balance */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark
                ? "bg-purple-900/20 border-purple-800/30"
                : "bg-purple-50 border-purple-200/50"
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div
                className={`p-2 rounded-lg ${
                  isDark ? "bg-purple-800/50" : "bg-purple-100"
                }`}
              >
                <Wallet className="w-5 h-5 text-purple-400" />
              </div>
              <span
                className={`text-sm font-medium ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Token Balance
              </span>
            </div>
            <p
              className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {formatNumber(profile.token_balance)}
            </p>
          </div>

          {/* Total Tokens Purchased */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark
                ? "bg-blue-900/20 border-blue-800/30"
                : "bg-blue-50 border-blue-200/50"
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div
                className={`p-2 rounded-lg ${
                  isDark ? "bg-blue-800/50" : "bg-blue-100"
                }`}
              >
                <ShoppingCart className="w-5 h-5 text-blue-400" />
              </div>
              <span
                className={`text-sm font-medium ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Total Purchased
              </span>
            </div>
            <p
              className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {formatNumber(profile.total_tokens_purchased)}
            </p>
          </div>

          {/* Videos Processed */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark
                ? "bg-green-900/20 border-green-800/30"
                : "bg-green-50 border-green-200/50"
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div
                className={`p-2 rounded-lg ${
                  isDark ? "bg-green-800/50" : "bg-green-100"
                }`}
              >
                <Video className="w-5 h-5 text-green-400" />
              </div>
              <span
                className={`text-sm font-medium ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Videos Processed
              </span>
            </div>
            <p
              className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {formatNumber(processedVideosCount)}
            </p>
            {processedVideosCount !== profile.total_videos_processed && (
              <p
                className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Real-time count from database
              </p>
            )}
          </div>

          {/* Last Updated */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark
                ? "bg-gray-800/50 border-gray-700/50"
                : "bg-gray-50 border-gray-200/50"
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div
                className={`p-2 rounded-lg ${
                  isDark ? "bg-gray-700/50" : "bg-gray-100"
                }`}
              >
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <span
                className={`text-sm font-medium ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Last Updated
              </span>
            </div>
            <p
              className={`text-lg font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {formatDate(profile.updated_at)}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 md:mt-8 flex flex-wrap gap-2 md:gap-3">
          <button
            onClick={() => {
              window.location.href = "/workspace/billing";
            }}
            className={`px-3 cursor-pointer md:px-4 py-2 rounded-xl font-medium text-sm md:text-base transition-all duration-300 ${
              isDark
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            Purchase Hours
          </button>
          {/* <button
            className={`px-3 md:px-4 py-2 rounded-xl font-medium text-sm md:text-base border transition-all duration-300 ${
              isDark
                ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            View History
          </button> */}
          <button
            onClick={() => {
              window.location.href = "/workspace/settings";
            }}
            className={`px-3 md:px-4 cursor-pointer py-2 rounded-xl font-medium text-sm md:text-base border transition-all duration-300 ${
              isDark
                ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;
