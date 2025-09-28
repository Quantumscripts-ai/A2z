"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import WorkspaceSidebar from "@/app/components/WorkspaceSidebar";
import WorkspaceNavbar from "@/app/components/WorkspaceNavbar";
import { STORAGE_KEYS } from "@/constants";

const IntegrationsPage = () => {
  const { isDark } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Persist sidebar state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  const integrations = {
    "Video Platforms": [
      {
        name: "YouTube",
        description: "Auto-upload subtitles to your YouTube videos",
        icon: "📺",
        connected: true,
        category: "Video",
      },
      {
        name: "Vimeo",
        description: "Sync subtitles with your Vimeo content",
        icon: "🎬",
        connected: false,
        category: "Video",
      },
      {
        name: "Wistia",
        description: "Enhance your Wistia videos with subtitles",
        icon: "💼",
        connected: false,
        category: "Video",
      },
    ],
    "Cloud Storage": [
      {
        name: "Google Drive",
        description: "Store and sync subtitle files with Google Drive",
        icon: "☁️",
        connected: true,
        category: "Storage",
      },
      {
        name: "Dropbox",
        description: "Backup subtitle files to Dropbox",
        icon: "📦",
        connected: false,
        category: "Storage",
      },
      {
        name: "OneDrive",
        description: "Microsoft OneDrive integration",
        icon: "🔵",
        connected: false,
        category: "Storage",
      },
    ],
    Communication: [
      {
        name: "Slack",
        description: "Get notifications in your Slack workspace",
        icon: "💬",
        connected: false,
        category: "Communication",
      },
      {
        name: "Discord",
        description: "Receive updates via Discord webhooks",
        icon: "🎮",
        connected: false,
        category: "Communication",
      },
      {
        name: "Microsoft Teams",
        description: "Team collaboration and notifications",
        icon: "👥",
        connected: false,
        category: "Communication",
      },
    ],
  };

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
            className={`absolute top-20 right-10 w-32 h-32 rounded-full blur-3xl animate-pulse ${
              isDark ? "bg-blue-600/10" : "bg-blue-600/5"
            }`}
          ></div>
          <div
            className={`absolute bottom-32 left-16 w-24 h-24 rounded-full blur-2xl animate-pulse ${
              isDark ? "bg-purple-600/8" : "bg-purple-600/4"
            }`}
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        {/* Page Header */}
        <div className="relative z-10 px-4 md:px-8 pb-6 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <h1
              className={`text-2xl md:text-3xl font-bold mb-2 transition-colors duration-300 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Integrations
            </h1>
            <p
              className={`text-sm md:text-base transition-colors duration-300 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Connect TranslateA2Z with your favorite tools and services
            </p>
          </div>
        </div>

        {/* Integrations Content */}
        <div className="relative z-10 px-4 md:px-8 pb-8 md:pb-12">
          <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
            {Object.entries(integrations).map(([category, apps]) => (
              <div key={category}>
                <h2
                  className={`text-lg md:text-xl font-bold mb-4 md:mb-6 transition-colors duration-300 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {apps.map((app, index) => (
                    <div
                      key={index}
                      className={`p-4 md:p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 group ${
                        isDark
                          ? "bg-black/50 border-gray-800 hover:border-purple-500/30"
                          : "bg-white/50 border-gray-200 hover:border-purple-300/50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl md:text-3xl">{app.icon}</div>
                          <div>
                            <h3
                              className={`font-semibold text-sm md:text-base transition-colors duration-300 ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {app.name}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                app.connected
                                  ? isDark
                                    ? "bg-green-900/30 text-green-400"
                                    : "bg-green-100 text-green-700"
                                  : isDark
                                    ? "bg-gray-800/50 text-gray-400"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {app.connected ? "Connected" : "Available"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p
                        className={`text-xs md:text-sm mb-4 transition-colors duration-300 ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {app.description}
                      </p>
                      <button
                        className={`w-full px-3 md:px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 ${
                          app.connected
                            ? isDark
                              ? "bg-red-900/20 text-red-400 hover:bg-red-900/30 border border-red-800/30"
                              : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            : isDark
                              ? "bg-purple-600 hover:bg-purple-700 text-white"
                              : "bg-purple-600 hover:bg-purple-700 text-white"
                        }`}
                      >
                        {app.connected ? "Disconnect" : "Connect"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* API Keys & Webhooks */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;
