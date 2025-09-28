"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import WorkspaceSidebar from "@/app/components/WorkspaceSidebar";
import WorkspaceNavbar from "@/app/components/WorkspaceNavbar";
import { STORAGE_KEYS } from "@/constants";

const SettingsPage = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [processingAlerts, setProcessingAlerts] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("users")
          .select("full_name, email")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user data:", error);
          return;
        }

        if (data) {
          setFullName(data.full_name || "");
          setEmail(data.email || "");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Persist sidebar state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        isDark ? "bg-black" : "bg-white"
      }`}
    >
      {/* Sidebar */}
      <WorkspaceSidebar
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Workspace Navbar */}
      <WorkspaceNavbar
        sidebarCollapsed={sidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "ml-0 md:ml-16" : "ml-0 md:ml-64"
        } pt-24 md:pt-20 relative overflow-hidden`}
      >
        {/* Dynamic Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-3xl animate-pulse ${
              isDark ? "bg-purple-600/10" : "bg-purple-600/5"
            }`}
          ></div>
          <div
            className={`absolute bottom-32 right-16 w-24 h-24 rounded-full blur-2xl animate-pulse ${
              isDark ? "bg-blue-600/8" : "bg-blue-600/4"
            }`}
            style={{ animationDelay: "3s" }}
          ></div>
        </div>

        {/* Page Header */}
        <div className="relative z-10 px-4 md:px-8 pb-6 md:pb-8">
          <div className="max-w-4xl mx-auto">
            <h1
              className={`text-2xl md:text-3xl font-bold mb-2 transition-colors duration-300 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Settings
            </h1>
            <p
              className={`text-sm md:text-base transition-colors duration-300 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Manage your account preferences and workspace settings
            </p>
          </div>
        </div>

        {/* Settings Content */}
        <div className="relative z-10 px-4 md:px-8 pb-8 md:pb-12">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            {/* Profile Settings */}
            <div
              className={`rounded-2xl md:rounded-3xl border backdrop-blur-sm p-6 md:p-8 transition-all duration-300 ${
                isDark
                  ? "bg-black/50 border-gray-800"
                  : "bg-white/50 border-gray-200"
              }`}
            >
              <h2
                className={`text-lg md:text-xl font-bold mb-4 md:mb-6 transition-colors duration-300 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Profile Settings
              </h2>
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-12 bg-gray-200 rounded-xl dark:bg-gray-700"></div>
                  <div className="h-12 bg-gray-200 rounded-xl dark:bg-gray-700"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full px-3 md:px-4 py-2 md:py-3 rounded-xl border transition-all duration-300 ${
                        isDark
                          ? "bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
                          : "bg-gray-50/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3 md:px-4 py-2 md:py-3 rounded-xl border transition-all duration-300 ${
                        isDark
                          ? "bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
                          : "bg-gray-50/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notification Settings */}
            <div
              className={`rounded-2xl md:rounded-3xl border backdrop-blur-sm p-6 md:p-8 transition-all duration-300 ${
                isDark
                  ? "bg-black/50 border-gray-800"
                  : "bg-white/50 border-gray-200"
              }`}
            >
              <h2
                className={`text-lg md:text-xl font-bold mb-4 md:mb-6 transition-colors duration-300 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Notification Settings
              </h2>
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div>
                    <h3
                      className={`font-medium text-sm md:text-base transition-colors duration-300 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Email Notifications
                    </h3>
                    <p
                      className={`text-xs md:text-sm transition-colors duration-300 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Receive updates about your account via email
                    </p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative w-12 h-6 md:w-14 md:h-7 rounded-full transition-all duration-300 ${
                      emailNotifications
                        ? "bg-purple-600"
                        : isDark
                          ? "bg-gray-700"
                          : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full transition-transform duration-300 ${
                        emailNotifications
                          ? "transform translate-x-6 md:translate-x-7"
                          : "transform translate-x-1"
                      }`}
                    ></div>
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div>
                    <h3
                      className={`font-medium text-sm md:text-base transition-colors duration-300 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Processing Alerts
                    </h3>
                    <p
                      className={`text-xs md:text-sm transition-colors duration-300 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Get notified when video processing is complete
                    </p>
                  </div>
                  <button
                    onClick={() => setProcessingAlerts(!processingAlerts)}
                    className={`relative w-12 h-6 md:w-14 md:h-7 rounded-full transition-all duration-300 ${
                      processingAlerts
                        ? "bg-purple-600"
                        : isDark
                          ? "bg-gray-700"
                          : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full transition-transform duration-300 ${
                        processingAlerts
                          ? "transform translate-x-6 md:translate-x-7"
                          : "transform translate-x-1"
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>

            {/* API Access */}
            {/* <div
              className={`rounded-2xl md:rounded-3xl border backdrop-blur-sm p-6 md:p-8 transition-all duration-300 ${
                isDark
                  ? "bg-black/50 border-gray-800"
                  : "bg-white/50 border-gray-200"
              }`}
            >
              <h2
                className={`text-lg md:text-xl font-bold mb-4 md:mb-6 transition-colors duration-300 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                API Access
              </h2>
              <div className="space-y-4 md:space-y-6">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    API Key
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <input
                      type="password"
                      value="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      readOnly
                      className={`flex-1 px-3 md:px-4 py-2 md:py-3 rounded-xl border transition-all duration-300 ${
                        isDark
                          ? "bg-gray-800/50 border-gray-700 text-white"
                          : "bg-gray-50/50 border-gray-200 text-gray-900"
                      }`}
                    />
                    <button
                      className={`px-4 md:px-6 py-2 md:py-3 rounded-xl border font-medium transition-all duration-300 whitespace-nowrap ${
                        isDark
                          ? "border-purple-600 text-purple-400 hover:bg-purple-600/10"
                          : "border-purple-600 text-purple-600 hover:bg-purple-50"
                      }`}
                    >
                      Regenerate
                    </button>
                  </div>
                  <p
                    className={`text-xs md:text-sm mt-2 transition-colors duration-300 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Use this key to access the API programmatically
                  </p>
                </div>
              </div>
            </div> */}

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                className={`px-6 md:px-8 py-2 md:py-3 rounded-xl font-medium transition-all duration-300 ${
                  isDark
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
