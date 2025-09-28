"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSubscription } from "@/hooks/useSubscription";
import { ANIMATIONS } from "@/constants";
import CreditDisplay from "./CreditDisplay";
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  Home,
} from "lucide-react";

interface WorkspaceNavbarProps {
  sidebarCollapsed: boolean;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

const WorkspaceNavbar = ({
  sidebarCollapsed,
  isMobileMenuOpen = false,
  setIsMobileMenuOpen,
}: WorkspaceNavbarProps) => {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { subscriptionData, isLoading: subscriptionLoading } = useSubscription(
    user?.id
  );
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    await signOut();
    // The AuthContext will handle the redirect
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(" ")
        .map((name: string) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleMobileMenuToggle = () => {
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    }
  };

  return (
    <nav
      className={`fixed top-0 right-0 transition-all duration-${
        ANIMATIONS.NORMAL
      } ease-in-out z-30 ${
        sidebarCollapsed
          ? "left-0 md:left-16" // Full width on mobile, account for sidebar on desktop
          : "left-0 md:left-64" // Full width on mobile, normal sidebar width on desktop
      } ${
        isDark ? "bg-black/95 border-gray-800" : "bg-white/95 border-gray-200"
      } backdrop-blur-sm border-b`}
    >
      <div className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Mobile Menu + Page Title */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={handleMobileMenuToggle}
              className={`md:hidden p-2 rounded-lg transition-all duration-${
                ANIMATIONS.FAST
              } ${
                isDark
                  ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page Title and Greeting */}
            <div className="min-w-0 flex-1">
              <h1
                className={`font-bold text-lg md:text-xl transition-colors duration-${
                  ANIMATIONS.FAST
                } truncate ${isDark ? "text-white" : "text-gray-900"}`}
              >
                <span className="md:hidden">Dashboard</span>
                <span className="hidden md:inline">Workspace Dashboard</span>
              </h1>
              <p
                className={`text-sm mt-0.5 transition-colors duration-${
                  ANIMATIONS.FAST
                } truncate ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                <span className="hidden sm:inline">
                  {getGreeting()},{" "}
                  {user?.user_metadata?.full_name?.split(" ")[0] || "there"}!
                </span>
                <span className="sm:hidden">Welcome back!</span>
              </p>
            </div>
          </div>

          {/* Right Side - Search, Notifications, Theme Toggle, Profile */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Search Bar - Hidden on mobile */}
            {/* <div className="hidden lg:block relative">
              <div
                className={`relative transition-all duration-${
                  ANIMATIONS.NORMAL
                } ${searchFocused ? "scale-105" : "scale-100"}`}
              >
                <Search
                  className={`absolute left-3 top-2.5 w-4 h-4 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className={`w-64 pl-10 pr-4 py-2 rounded-xl border transition-all duration-${
                    ANIMATIONS.NORMAL
                  } ${
                    isDark
                      ? "bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:bg-gray-800/70"
                      : "bg-gray-50/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:bg-white"
                  } focus:outline-none`}
                />
              </div>
            </div> */}

            {/* Notifications */}
            {/* <button
              className={`relative p-2 md:p-2.5 rounded-xl transition-all duration-${
                ANIMATIONS.FAST
              } ${
                isDark
                  ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </button> */}

            {/* Credits Display */}
            <CreditDisplay className="hidden md:flex" />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 md:p-2.5 rounded-xl transition-all duration-${
                ANIMATIONS.FAST
              } ${
                isDark
                  ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
            >
              {isDark ? (
                <Sun className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Moon className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center space-x-2 md:space-x-3 p-1.5 md:p-2 rounded-xl transition-all duration-${
                  ANIMATIONS.FAST
                } ${
                  isDark
                    ? "hover:bg-gray-800 text-white"
                    : "hover:bg-gray-100 text-gray-900"
                }`}
              >
                {/* Avatar */}
                <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                  {getUserInitials()}
                </div>

                {/* User Info - Hidden on mobile */}
                <div className="hidden md:block text-left min-w-0">
                  <p
                    className={`font-medium text-sm truncate max-w-24 lg:max-w-32 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {user?.user_metadata?.full_name || "User"}
                  </p>
                  <p
                    className={`text-xs truncate max-w-24 lg:max-w-32 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {user?.email}
                  </p>
                </div>

                {/* Dropdown Arrow - Hidden on mobile */}
                <ChevronDown
                  className={`hidden md:block w-4 h-4 transition-transform duration-200 ${
                    isProfileOpen ? "rotate-180" : ""
                  } ${isDark ? "text-gray-400" : "text-gray-600"}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div
                  className={`absolute right-0 mt-2 w-56 md:w-64 rounded-2xl shadow-lg border backdrop-blur-sm z-50 transition-all duration-${
                    ANIMATIONS.NORMAL
                  } ${
                    isDark
                      ? "bg-gray-900/95 border-gray-700"
                      : "bg-white/95 border-gray-200"
                  }`}
                >
                  {/* Mobile: Show user info in dropdown */}
                  <div
                    className={`md:hidden p-4 border-b ${
                      isDark ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <p
                      className={`font-medium text-sm ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {user?.user_metadata?.full_name || "User"}
                    </p>
                    <p
                      className={`text-xs ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {user?.email}
                    </p>
                  </div>

                  {/* Subscription Status */}
                  <div
                    className={`p-4 border-b ${
                      isDark ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Plan:
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          isDark ? "text-purple-400" : "text-purple-600"
                        }`}
                      >
                        {subscriptionLoading
                          ? "Loading..."
                          : subscriptionData?.subscriptionStatus || "NA"}
                      </span>
                    </div>
                    {subscriptionData?.nextBillingDate && (
                      <p
                        className={`text-xs mt-1 ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Next billing:{" "}
                        {new Date(
                          subscriptionData.nextBillingDate
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="p-2">
                    <Link
                      href="/"
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-${
                        ANIMATIONS.FAST
                      } ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                    >
                      <Home className="w-4 h-4" />
                      <span className="font-medium">Home</span>
                    </Link>
                    <a
                      href="/workspace"
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-${
                        ANIMATIONS.FAST
                      } ${
                        isDark
                          ? "hover:bg-gray-800 text-gray-300 hover:text-white"
                          : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="font-medium">Workspace</span>
                    </a>
                    <a
                      href="/workspace/settings"
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-${
                        ANIMATIONS.FAST
                      } ${
                        isDark
                          ? "hover:bg-gray-800 text-gray-300 hover:text-white"
                          : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span className="font-medium">Settings</span>
                    </a>
                  </div>
                  <div
                    className={`border-t p-2 ${
                      isDark ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <button
                      onClick={handleSignOut}
                      className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-${
                        ANIMATIONS.FAST
                      } ${
                        isDark
                          ? "hover:bg-red-900/20 text-red-400 hover:text-red-300"
                          : "hover:bg-red-50 text-red-600 hover:text-red-700"
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default WorkspaceNavbar;
