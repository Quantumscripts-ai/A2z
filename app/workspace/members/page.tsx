"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import WorkspaceSidebar from "@/app/components/WorkspaceSidebar";
import WorkspaceNavbar from "@/app/components/WorkspaceNavbar";
import { STORAGE_KEYS } from "@/constants";
import { supabase } from "@/lib/supabase";

const MembersPage = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Video collaborators state
  const [videoCollaborators, setVideoCollaborators] = useState<
    Array<{
      id: string;
      video_id: string;
      user_id: string;
      role: string;
      status: string;
      created_at: string;
      added_at?: string;
      users?: {
        full_name?: string;
        email: string;
      };
      videos?: {
        filename: string;
      };
    }>
  >([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [isLoading, setIsLoading] = useState(false);

  // Video selection state
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [userVideos, setUserVideos] = useState<
    Array<{
      id: string;
      filename: string;
      created_at?: string;
    }>
  >([]);

  // Fetch user's videos for the dropdown
  const fetchUserVideos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("videos")
        .select("id, filename")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching videos:", error);
      } else {
        setUserVideos(data || []);
        if (data && data.length > 0) {
          setSelectedVideoId(data[8].id);
        }
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  // Fetch video collaborators from the database
  const fetchVideoCollaborators = async () => {
    if (!user) {
      console.log("No user found, skipping collaborators fetch");
      return;
    }

    console.log("=== COMPREHENSIVE DEBUGGING ===");
    console.log("Current user:", { id: user.id, email: user.email });
    setLoadingCollaborators(true);

    try {
      // Test 1: Check if table exists and has any data at all
      console.log("Test 1: Basic table access...");
      const {
        data: basicTest,
        error: basicError,
        count,
      } = await supabase
        .from("video_collaborators")
        .select("*", { count: "exact" });

      console.log("Basic test result:", {
        data: basicTest,
        error: basicError,
        totalRows: count,
        dataCount: basicTest?.length,
      });

      if (basicError) {
        console.error("FAILED: Cannot access video_collaborators table");
        alert("Database Error: " + basicError.message);
        return;
      }

      // Test 2: Check what user IDs exist in the table
      if (basicTest && basicTest.length > 0) {
        console.log("Test 2: User IDs in video_collaborators table:");
        const userIds = [...new Set(basicTest.map((item) => item.user_id))];
        console.log("Unique user IDs found:", userIds);
        console.log("Current user ID matches any?", userIds.includes(user.id));

        // Test 3: Check videos table for this user
        console.log("Test 3: User's videos...");
        const { data: userVideos, error: videosError } = await supabase
          .from("videos")
          .select("id, filename, user_id")
          .eq("user_id", user.id);

        console.log("User's videos:", { data: userVideos, error: videosError });

        // Test 4: Check if any collaborators are for this user's videos
        if (userVideos && userVideos.length > 0) {
          const userVideoIds = userVideos.map((v) => v.id);
          const relevantCollaborators = basicTest.filter((collab) =>
            userVideoIds.includes(collab.video_id)
          );
          console.log(
            "Collaborators for user's videos:",
            relevantCollaborators
          );
        }

        // Test 5: Check users table
        console.log("Test 5: Check users table...");
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, email, full_name")
          .limit(10);
        console.log("Users table sample:", {
          data: usersData,
          error: usersError,
        });
      }

      // Test 6: Try the enriched query
      console.log("Test 6: Building enriched data...");
      const enrichedData = [];

      if (basicTest && basicTest.length > 0) {
        for (const collaborator of basicTest) {
          console.log("Processing collaborator:", collaborator);

          // Fetch user details
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id, email, full_name")
            .eq("id", collaborator.user_id)
            .single();

          // Fetch video details
          const { data: videoData, error: videoError } = await supabase
            .from("videos")
            .select("id, filename")
            .eq("id", collaborator.video_id)
            .single();

          console.log("User lookup:", { userData, userError });
          console.log("Video lookup:", { videoData, videoError });

          enrichedData.push({
            ...collaborator,
            users: userData,
            videos: videoData,
          });
        }
      }

      console.log("Final enriched data:", enrichedData);
      setVideoCollaborators(enrichedData);
    } catch (error) {
      console.error("Catch block error:", error);
      alert("Unexpected error: " + (error as Error).message);
    } finally {
      setLoadingCollaborators(false);
      console.log("=== DEBUGGING COMPLETE ===");
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      alert("Please enter an email address");
      return;
    }

    if (!selectedVideoId) {
      alert("Please select a video");
      return;
    }

    setIsLoading(true);

    try {
      // Look up user by email in the public.users table (which has the same id as auth.users)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", inviteEmail.trim())
        .single();

      if (userError || !userData) {
        alert(
          "User not found. Please make sure the email is correct and the user has an account."
        );
        setIsLoading(false);
        return;
      }

      // Insert into video_collaborators table
      const { error: collaboratorError } = await supabase
        .from("video_collaborators")
        .insert({
          video_id: selectedVideoId,
          user_id: userData.id,
          role: inviteRole,
        });

      if (collaboratorError) {
        alert("Error adding collaborator: " + collaboratorError.message);
        setIsLoading(false);
        return;
      }

      // Success
      alert("Member invited successfully!");
      setIsModalOpen(false);
      setInviteEmail("");
      setInviteRole("editor");

      // Refresh the collaborators list
      fetchVideoCollaborators();
    } catch (error) {
      alert("An unexpected error occurred");
      console.error("Invite error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load video collaborators and videos on component mount
  useEffect(() => {
    console.log("useEffect triggered, user:", user);
    if (user) {
      console.log("User is authenticated, fetching data...");
      fetchVideoCollaborators();
      fetchUserVideos();
    } else {
      console.log("No user found, not fetching data");
    }
  }, [user]);

  // Persist sidebar state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Helper function to get user initials for avatar
  const getUserInitials = (fullName: string) => {
    if (!fullName) return "??";
    const names = fullName.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
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
            {/* Debug Info */}
            <div
              className={`mb-4 p-3 rounded-lg text-xs ${
                isDark
                  ? "bg-gray-800 text-gray-300"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <strong>Debug Info:</strong> User:{" "}
              {user ? `✓ ${user.email}` : "✗ Not logged in"} | Collaborators:{" "}
              {videoCollaborators.length} | Loading:{" "}
              {loadingCollaborators ? "Yes" : "No"}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1
                  className={`text-2xl md:text-3xl font-bold mb-2 transition-colors duration-300 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Video Collaborators
                </h1>
                <p
                  className={`text-sm md:text-base transition-colors duration-300 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Manage collaborators across all your videos
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchVideoCollaborators()}
                  disabled={loadingCollaborators}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  } disabled:opacity-50`}
                >
                  {loadingCollaborators ? "Loading..." : "Refresh Data"}
                </button>
                <button
                  onClick={async () => {
                    console.log("Testing raw database access...");
                    const { data: allData, error } = await supabase
                      .from("video_collaborators")
                      .select("*");
                    console.log("All video_collaborators data:", {
                      allData,
                      error,
                    });

                    const { data: usersData, error: usersError } =
                      await supabase
                        .from("users")
                        .select("id, email, full_name")
                        .limit(5);
                    console.log("Sample users data:", {
                      usersData,
                      usersError,
                    });

                    const { data: videosData, error: videosError } =
                      await supabase
                        .from("videos")
                        .select("id, filename")
                        .limit(5);
                    console.log("Sample videos data:", {
                      videosData,
                      videosError,
                    });
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isDark
                      ? "bg-blue-700 hover:bg-blue-600 text-white"
                      : "bg-blue-200 hover:bg-blue-300 text-blue-900"
                  }`}
                >
                  Test DB
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                    isDark
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                >
                  Invite Collaborator
                </button>
              </div>
            </div>
          </div>
        </div>{" "}
        {/* Members Content */}
        <div className="relative z-10 px-4 md:px-8 pb-8 md:pb-12">
          <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
            {/* Current Collaborators */}
            <div
              className={`rounded-2xl md:rounded-3xl border backdrop-blur-sm p-4 md:p-6 lg:p-8 transition-all duration-300 ${
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
                Current Collaborators ({videoCollaborators.length})
              </h2>

              {loadingCollaborators ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <span
                    className={`ml-2 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Loading collaborators...
                  </span>
                </div>
              ) : videoCollaborators.length === 0 ? (
                <div className="text-center py-8">
                  <p
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    No collaborators found. Start by inviting someone to
                    collaborate on your videos.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Card Layout */}
                  <div className="block md:hidden space-y-4">
                    {videoCollaborators.map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className={`p-4 rounded-xl border transition-all duration-300 ${
                          isDark
                            ? "bg-gray-900/50 border-gray-700"
                            : "bg-gray-50/50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {getUserInitials(
                                collaborator.users?.full_name || ""
                              )}
                            </div>
                            <div>
                              <h3
                                className={`font-medium text-sm transition-colors duration-300 ${
                                  isDark ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {collaborator.users?.full_name ||
                                  "Unknown User"}
                              </h3>
                              <p
                                className={`text-xs transition-colors duration-300 ${
                                  isDark ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                {collaborator.users?.email}
                              </p>
                              <p
                                className={`text-xs transition-colors duration-300 ${
                                  isDark ? "text-gray-500" : "text-gray-500"
                                }`}
                              >
                                Video:{" "}
                                {collaborator.videos?.filename || "Unknown"}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              collaborator.role === "owner"
                                ? isDark
                                  ? "bg-purple-900/30 text-purple-400"
                                  : "bg-purple-100 text-purple-700"
                                : collaborator.role === "editor"
                                  ? isDark
                                    ? "bg-blue-900/30 text-blue-400"
                                    : "bg-blue-100 text-blue-700"
                                  : isDark
                                    ? "bg-gray-800/50 text-gray-400"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {collaborator.role}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`px-2 py-1 rounded-full ${
                              isDark
                                ? "bg-green-900/30 text-green-400"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            Active
                          </span>
                          <span
                            className={`transition-colors duration-300 ${
                              isDark ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            Added{" "}
                            {collaborator.added_at
                              ? new Date(
                                  collaborator.added_at
                                ).toLocaleDateString()
                              : "Unknown date"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table Layout */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr
                          className={`border-b transition-colors duration-300 ${
                            isDark ? "border-gray-700" : "border-gray-200"
                          }`}
                        >
                          <th
                            className={`text-left py-3 px-4 font-medium text-sm transition-colors duration-300 ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Collaborator
                          </th>
                          <th
                            className={`text-left py-3 px-4 font-medium text-sm transition-colors duration-300 ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Video
                          </th>
                          <th
                            className={`text-left py-3 px-4 font-medium text-sm transition-colors duration-300 ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Role
                          </th>
                          <th
                            className={`text-left py-3 px-4 font-medium text-sm transition-colors duration-300 ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Added
                          </th>
                          <th className="w-20"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {videoCollaborators.map((collaborator) => (
                          <tr
                            key={collaborator.id}
                            className={`border-b transition-colors duration-300 ${
                              isDark ? "border-gray-800" : "border-gray-100"
                            }`}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {getUserInitials(
                                    collaborator.users?.full_name || ""
                                  )}
                                </div>
                                <div>
                                  <p
                                    className={`font-medium text-sm transition-colors duration-300 ${
                                      isDark ? "text-white" : "text-gray-900"
                                    }`}
                                  >
                                    {collaborator.users?.full_name ||
                                      "Unknown User"}
                                  </p>
                                  <p
                                    className={`text-xs transition-colors duration-300 ${
                                      isDark ? "text-gray-400" : "text-gray-600"
                                    }`}
                                  >
                                    {collaborator.users?.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p
                                className={`text-sm transition-colors duration-300 ${
                                  isDark ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {collaborator.videos?.filename || "Unknown"}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  collaborator.role === "owner"
                                    ? isDark
                                      ? "bg-purple-900/30 text-purple-400"
                                      : "bg-purple-100 text-purple-700"
                                    : collaborator.role === "editor"
                                      ? isDark
                                        ? "bg-blue-900/30 text-blue-400"
                                        : "bg-blue-100 text-blue-700"
                                      : isDark
                                        ? "bg-gray-800/50 text-gray-400"
                                        : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {collaborator.role}
                              </span>
                            </td>
                            <td
                              className={`py-4 px-4 text-sm transition-colors duration-300 ${
                                isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {collaborator.added_at
                                ? new Date(
                                    collaborator.added_at
                                  ).toLocaleDateString()
                                : "Unknown date"}
                            </td>
                            <td className="py-4 px-4">
                              <button
                                className={`text-xs px-3 py-1 rounded-lg transition-colors duration-300 ${
                                  isDark
                                    ? "text-gray-400 hover:text-white hover:bg-gray-800"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                }`}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Collaborator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            className={`w-full max-w-md rounded-xl shadow-lg border transition-all duration-300 ${
              isDark
                ? "bg-gray-900 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="p-6">
              <h3
                className={`text-lg font-bold mb-4 transition-colors duration-300 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Invite Collaborator
              </h3>

              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Select Video
                  </label>
                  <select
                    value={selectedVideoId}
                    onChange={(e) => setSelectedVideoId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${
                      isDark
                        ? "bg-gray-800 border-gray-600 text-white focus:border-purple-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-purple-500"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  >
                    <option value="">Select a video...</option>
                    {userVideos.map((video) => (
                      <option key={video.id} value={video.id}>
                        {video.filename}
                      </option>
                    ))}
                  </select>
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
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${
                      isDark
                        ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${
                      isDark
                        ? "bg-gray-800 border-gray-600 text-white focus:border-purple-500"
                        : "bg-white border-gray-300 text-gray-900 focus:border-purple-500"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  } disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteMember}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    isDark
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  } disabled:opacity-50`}
                >
                  {isLoading ? "Inviting..." : "Send Invite"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
