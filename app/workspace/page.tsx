"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { useCredits } from "@/hooks/useCredits";
import WithAuth from "@/app/components/WithAuth";
import UserProfileCard from "@/app/components/UserProfileCard";
import WorkspaceSidebar from "@/app/components/WorkspaceSidebar";
import WorkspaceNavbar from "@/app/components/WorkspaceNavbar";
import VideoUploadSection from "@/app/components/VideoUploadSection";
import UserVideosList from "@/app/components/UserVideosList";
import QueueStatus from "@/app/components/QueueStatus";
import CreditBadge from "@/app/components/CreditBadge";
import { STORAGE_KEYS } from "@/constants";

const WorkspacePage = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { credits, refreshCredits } = useCredits(user?.id);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Since WithAuth ensures user exists, we can assert it's not null
  const authenticatedUser = user!;

  // Persist sidebar state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  const handleUpload = async (file: File, language: string) => {
    if (!user) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);
    formData.append("userId", user.id);

    // 1) Upload to Supabase Storage + create DB row
    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const uploadJson = await uploadRes.json();

    if (!uploadRes.ok) {
      alert(uploadJson.error || "Upload failed");
      return;
    }

    // 2) Trigger transcription
    const transcribeForm = new FormData();
    transcribeForm.append("file", file);
    transcribeForm.append("language", language);
    transcribeForm.append("userId", user.id);
    transcribeForm.append("videoId", uploadJson.videoId);

    const transcribeRes = await fetch("/api/transcribe", {
      method: "POST",
      body: transcribeForm,
    });

    if (!transcribeRes.ok) {
      const tj = await transcribeRes.json();
      alert(tj.error || "Transcription failed");
    }
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
            className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-3xl animate-pulse ${
              isDark ? "bg-purple-600/10" : "bg-purple-600/5"
            }`}
          ></div>
          <div
            className={`absolute top-40 right-16 w-24 h-24 rounded-full blur-2xl animate-pulse ${
              isDark ? "bg-blue-600/8" : "bg-blue-600/4"
            }`}
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className={`absolute bottom-32 left-1/3 w-40 h-40 rounded-full blur-3xl animate-pulse ${
              isDark ? "bg-purple-500/8" : "bg-purple-500/4"
            }`}
            style={{ animationDelay: "4s" }}
          ></div>
        </div>

        {/* Welcome Header */}
        <div className="relative z-10 px-4 md:px-8 pb-6 md:pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <h2
                className={`text-2xl md:text-4xl font-bold mb-3 md:mb-4 transition-colors duration-300 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Welcome to your AI Subtitle Studio
              </h2>
              <p
                className={`text-base md:text-xl max-w-2xl mx-auto transition-colors duration-300 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Transform your videos with AI-powered subtitle generation
              </p>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="relative z-10 px-4 md:px-8 mb-8 md:mb-12">
          <div className="max-w-7xl mx-auto">
            {user && <UserProfileCard userId={user.id} />}
          </div>
        </div>

        {/* Main Workspace Grid */}
        <div className="relative z-10 px-4 md:px-8 pb-8 md:pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {/* Video Upload Section */}
              <div className="lg:col-span-2 space-y-6">
                <div
                  className={`rounded-3xl border backdrop-blur-sm p-6 md:p-8 transition-all duration-300 hover:shadow-lg ${
                    isDark
                      ? "bg-black/50 border-gray-800 hover:border-purple-500/30"
                      : "bg-white/50 border-gray-200 hover:border-purple-300/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3
                      className={`text-xl md:text-2xl font-bold transition-colors duration-300 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Upload & Generate Subtitles
                    </h3>
                    <CreditBadge userId={user?.id} />
                  </div>
                  <VideoUploadSection
                    userId={user?.id}
                    onFileSelect={() => {}}
                    onUploadStart={() => {}}
                    onGenerate={async (files, language, helpers) => {
                      if (!user) return;
                      helpers.setUploading(true);
                      helpers.setProgress(5);

                      try {
                        // Get video metadata for accurate credit calculation
                        const { getMultipleVideoMetadata } = await import(
                          "@/utils/videoMetadata"
                        );
                        const videoMetadata =
                          await getMultipleVideoMetadata(files);

                        // Create batch upload form data
                        const formData = new FormData();
                        files.forEach((file) => formData.append("files", file));
                        formData.append("language", language);
                        formData.append("userId", user.id);
                        formData.append(
                          "videoMetadata",
                          JSON.stringify(videoMetadata)
                        );

                        helpers.setProgress(20);

                        // Add files to queue with timeout
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

                        let queueResponse;
                        try {
                          queueResponse = await fetch("/api/queue/add", {
                            method: "POST",
                            body: formData,
                            signal: controller.signal,
                          });
                          clearTimeout(timeoutId);
                        } catch (fetchError: unknown) {
                          clearTimeout(timeoutId);
                          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                            throw new Error("Request timeout. Please check your internet connection and try again with fewer or smaller files.");
                          }
                          const message = fetchError instanceof Error ? fetchError.message : 'Unknown network error';
                          throw new Error(`Network error: ${message}`);
                        }

                        let queueResult;
                        try {
                          const responseText = await queueResponse.text();
                          queueResult = JSON.parse(responseText);
                        } catch (parseError) {
                          console.error("Failed to parse queue response:", parseError);
                          throw new Error("Server returned invalid response. Please check your internet connection and try again.");
                        }

                        if (!queueResponse.ok) {
                          if (queueResponse.status === 402) {
                            // Insufficient credits
                            alert(
                              queueResult.message ||
                                `Insufficient credits! You need ${queueResult.required} credits but only have ${queueResult.available} credits. Please purchase more credits to continue.`
                            );
                          } else {
                            alert(
                              queueResult.error ||
                                "Failed to add files to queue"
                            );
                          }
                          helpers.setUploading(false);
                          return;
                        }

                        helpers.setProgress(50);
                        helpers.setBatchId(queueResult.batchId);

                        // Start processing the first video in the batch
                        const processResponse = await fetch(
                          "/api/queue/process",
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              batchId: queueResult.batchId,
                            }),
                          }
                        );

                        if (!processResponse.ok) {
                          console.warn(
                            "Failed to start batch processing immediately"
                          );
                          // Don't fail the entire upload if processing start fails
                          // The auto-process will handle it
                        } else {
                          helpers.setProgress(80);
                        }

                        // Refresh credits after successful upload
                        await refreshCredits();

                        helpers.setProgress(100);
                        alert(
                          `Successfully added ${files.length} files to processing queue!`
                        );

                        // Refresh the page after a short delay to show updated video list
                        setTimeout(() => {
                          window.location.reload();
                        }, 2000);
                      } catch (error) {
                        console.error("Batch upload error:", error);
                        alert("Failed to upload files. Please try again.");
                        helpers.setUploading(false);
                      }
                    }}
                    className="mb-4"
                  />
                  {/* Upload & Transcribe Button bound to workflow */}
                  {/* We attach our handler by passing it via onFileSelect and intercepting Upload button inside the component would be better. Simplest: expose a callback here. */}
                </div>

                {/* List of user's videos */}
                <UserVideosList userId={authenticatedUser.id} />

                {/* Queue Status */}
                <div
                  className={`rounded-3xl border backdrop-blur-sm p-6 md:p-8 transition-all duration-300 hover:shadow-lg ${
                    isDark
                      ? "bg-black/50 border-gray-800 hover:border-purple-500/30"
                      : "bg-white/50 border-gray-200 hover:border-purple-300/50"
                  }`}
                >
                  <QueueStatus userId={authenticatedUser.id} />
                </div>
              </div>

              {/* Recent Activity
              <div className="lg:col-span-1">
                <div
                  className={`rounded-3xl border backdrop-blur-sm p-6 md:p-8 transition-all duration-300 hover:shadow-lg ${
                    isDark
                      ? "bg-black/50 border-gray-800 hover:border-purple-500/30"
                      : "bg-white/50 border-gray-200 hover:border-purple-300/50"
                  }`}
                >
                  <h3
                    className={`text-xl md:text-2xl font-bold mb-4 md:mb-6 transition-colors duration-300 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Recent Activity
                  </h3>
                  <div className="space-y-3 md:space-y-4">
                    {[
                      {
                        action: "Video processed",
                        file: "presentation.mp4",
                        time: "2 hours ago",
                        status: "completed",
                      },
                      {
                        action: "Subtitles exported",
                        file: "tutorial.mov",
                        time: "5 hours ago",
                        status: "completed",
                      },
                      {
                        action: "Processing started",
                        file: "demo.mp4",
                        time: "1 day ago",
                        status: "in-progress",
                      },
                    ].map((activity, index) => (
                      <div
                        key={index}
                        className={`p-3 md:p-4 rounded-xl border transition-all duration-300 ${
                          isDark
                            ? "bg-gray-900/30 border-gray-700/50"
                            : "bg-gray-50/30 border-gray-200/50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p
                            className={`font-medium text-sm md:text-base transition-colors duration-300 ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {activity.action}
                          </p>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              activity.status === "completed"
                                ? isDark
                                  ? "bg-green-900/30 text-green-400"
                                  : "bg-green-100 text-green-700"
                                : isDark
                                ? "bg-yellow-900/30 text-yellow-400"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {activity.status}
                          </span>
                        </div>
                        <p
                          className={`text-xs md:text-sm transition-colors duration-300 ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {activity.file}
                        </p>
                        <p
                          className={`text-xs mt-1 transition-colors duration-300 ${
                            isDark ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          {activity.time}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div> */}
            </div>

            {/* Statistics Row */}
            {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-6 md:mt-8">
              {[
                { label: "Videos Processed", value: "127", trend: "+12%" },
                { label: "Hours Saved", value: "45.2", trend: "+8%" },
                { label: "Accuracy Rate", value: "98.5%", trend: "+2%" },
                { label: "Active Projects", value: "8", trend: "+3" },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`p-4 md:p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                    isDark
                      ? "bg-black/50 border-gray-800 hover:border-purple-500/30"
                      : "bg-white/50 border-gray-200 hover:border-purple-300/50"
                  }`}
                >
                  <p
                    className={`text-xs md:text-sm font-medium mb-1 md:mb-2 transition-colors duration-300 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {stat.label}
                  </p>
                  <p
                    className={`text-xl md:text-2xl font-bold mb-1 transition-colors duration-300 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs font-medium text-green-500">
                    {stat.trend}
                  </p>
                </div>
              ))}
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProtectedWorkspacePage = () => {
  return (
    <WithAuth>
      <WorkspacePage />
    </WithAuth>
  );
};

export default ProtectedWorkspacePage;
