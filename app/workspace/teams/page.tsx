"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import WorkspaceSidebar from "@/app/components/WorkspaceSidebar";
import WorkspaceNavbar from "@/app/components/WorkspaceNavbar";
import { STORAGE_KEYS } from "@/constants";
import {
  createTeam,
  createTeamInvitation,
  getUserTeams,
  getTeamVideos,
  shareVideoWithTeam,
  getUserInfoBatch,
  updateTeamMemberRole,
} from "@/lib/teamCollaboration";
import { supabase } from "@/lib/supabase";

interface Team {
  id: string;
  name: string;
  description?: string;
  admin_user_id: string;
  created_at: string;
  role: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

const TeamsPage = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { subscriptionData, isLoading: subscriptionLoading } = useSubscription(
    user?.id
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Teams state
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamVideos, setTeamVideos] = useState<
    Array<{
      video: {
        id: string;
        filename: string;
        status: string;
        created_at: string;
        user_id: string;
      };
      userInfo?: {
        full_name?: string;
      };
      permissions: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showShareVideo, setShowShareVideo] = useState(false);

  // Form states
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [userVideos, setUserVideos] = useState<
    Array<{
      id: string;
      filename: string;
    }>
  >([]);

  // Role editing states
  const [editingMemberRole, setEditingMemberRole] = useState<string | null>(
    null
  );
  const [newRole, setNewRole] = useState<"admin" | "editor" | "member">(
    "member"
  );

  console.log(subscriptionData);

  // Helper function to check if current user is admin in selected team
  const isCurrentUserAdmin = () => {
    if (!selectedTeam || !user) return false;

    // Check if user is the team owner (original admin)
    if (selectedTeam.admin_user_id === user.id) return true;

    // Check if user has admin role in team members
    const currentUserMember = teamMembers.find(
      (member) => member.user_id === user.id
    );
    return currentUserMember?.role === "admin";
  };

  // Fetch user's teams
  const fetchUserTeams = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await getUserTeams(user.id);
      if (error) {
        console.error("Error fetching teams:", error);
      } else {
        setUserTeams(data || []);
        if (data && data.length > 0 && !selectedTeam) {
          setSelectedTeam(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch team members
  const fetchTeamMembers = async (teamId: string) => {
    try {
      // Get team members with basic info
      const { data: membersData, error: membersError } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId)
        .eq("is_active", true);

      if (membersError) {
        console.error("Error fetching team members:", membersError);
        return;
      }

      if (!membersData || membersData.length === 0) {
        setTeamMembers([]);
        return;
      }

      // Get user info for all members
      const userIds = membersData.map((member) => member.user_id);
      const userInfoMap = await getUserInfoBatch(userIds);

      // Combine member data with user info
      const membersWithUserInfo = membersData.map((member) => ({
        ...member,
        user: userInfoMap[member.user_id] || {
          full_name: `User ${member.user_id.substring(0, 8)}...`,
          email: "Email not available",
        },
      }));

      setTeamMembers(membersWithUserInfo);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  // Fetch team videos
  const fetchTeamVideos = async (teamId: string) => {
    try {
      const { data, error } = await getTeamVideos(teamId);
      if (error) {
        console.error("Error fetching team videos:", error);
        setTeamVideos([]);
        return;
      }

      if (!data || data.length === 0) {
        setTeamVideos([]);
        return;
      }

      // Get user info for all video owners
      const userIds = data.map((video) => video.video.user_id).filter(Boolean);
      const userInfoMap = await getUserInfoBatch(userIds);

      // Add user info to videos
      const videosWithUserInfo = data.map((video) => ({
        ...video,
        userInfo: userInfoMap[video.video.user_id] || {
          full_name: `User ${video.video.user_id?.substring(0, 8)}...`,
          email: "Email not available",
        },
      }));

      setTeamVideos(videosWithUserInfo);
    } catch (error) {
      console.error("Error fetching team videos:", error);
      setTeamVideos([]);
    }
  };

  // Fetch user's videos for sharing
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
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  // Manual refresh function
  const refreshAllData = async () => {
    console.log("Manually refreshing all data...");
    if (user) {
      await fetchUserTeams();
      await fetchUserVideos();
      if (selectedTeam) {
        await fetchTeamMembers(selectedTeam.id);
        await fetchTeamVideos(selectedTeam.id);
      }
    }
  };

  // Create team
  const handleCreateTeam = async () => {
    if (!user || !teamName.trim()) return;

    try {
      const result = await createTeam(teamName, teamDescription);

      if (result.success) {
        alert("Team created successfully!");
        setShowCreateTeam(false);
        setTeamName("");
        setTeamDescription("");
        fetchUserTeams();
      } else {
        alert("Error creating team: " + result.error);
      }
    } catch (error) {
      alert("Error creating team: " + (error as Error).message);
    }
  };

  // Invite member
  const handleInviteMember = async () => {
    if (!selectedTeam || !user || !inviteEmail.trim()) return;

    try {
      const result = await createTeamInvitation(
        selectedTeam.id,
        user.id,
        inviteEmail,
        inviteRole as "admin" | "editor" | "viewer"
      );

      if (result.success) {
        alert("Invitation sent successfully!");
        setShowInviteMember(false);
        setInviteEmail("");
        setInviteRole("member");
        // Refresh team members list
        if (selectedTeam) {
          fetchTeamMembers(selectedTeam.id);
        }
      } else {
        alert("Error sending invitation: " + result.error);
      }
    } catch (error) {
      alert("Error sending invitation");
    }
  };

  // Update member role
  const handleUpdateMemberRole = async (
    memberId: string,
    memberUserId: string,
    currentRole: string
  ) => {
    if (!selectedTeam || !user) return;

    try {
      const result = await updateTeamMemberRole(
        selectedTeam.id,
        memberUserId,
        newRole,
        user.id
      );

      if (result.success) {
        alert(`Member role updated to ${newRole} successfully!`);
        setEditingMemberRole(null);
        // Refresh team members list
        fetchTeamMembers(selectedTeam.id);
      } else {
        alert("Error updating member role: " + result.error);
      }
    } catch (error) {
      alert("Error updating member role: " + (error as Error).message);
    }
  };

  // Cancel role editing
  const handleCancelRoleEdit = () => {
    setEditingMemberRole(null);
    setNewRole("member");
  };

  // Start role editing
  const handleStartRoleEdit = (
    memberId: string,
    currentRole: "admin" | "editor" | "member"
  ) => {
    setEditingMemberRole(memberId);
    setNewRole(currentRole);
  };

  // Share video with team
  const handleShareVideo = async () => {
    if (!selectedTeam || !user || !selectedVideoId) return;

    try {
      const { error } = await shareVideoWithTeam(
        selectedVideoId,
        selectedTeam.id,
        user.id,
        "view"
      );

      if (error) {
        alert("Error sharing video: " + error.message);
      } else {
        alert("Video shared with team successfully!");
        setShowShareVideo(false);
        setSelectedVideoId("");
        fetchTeamVideos(selectedTeam.id);
      }
    } catch (error) {
      alert("Error sharing video");
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserTeams();
      fetchUserVideos();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam.id);
      fetchTeamVideos(selectedTeam.id);
    }
  }, [selectedTeam]);

  // Persist sidebar state
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Realtime subscriptions for automatic updates
  useEffect(() => {
    if (!user) return;

    console.log("Setting up realtime subscriptions for user:", user.id);

    // Subscribe to ALL team_members changes (broader subscription)
    const teamMembersSubscription = supabase
      .channel("team_members_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_members",
        },
        (payload) => {
          console.log("Any team membership changed:", payload);
          // Always refresh user teams when any team membership changes
          fetchUserTeams();
          // If this affects the current selected team, refresh members too
          if (
            selectedTeam &&
            (payload.new as { team_id?: string })?.team_id === selectedTeam.id
          ) {
            fetchTeamMembers(selectedTeam.id);
          }
        }
      )
      .subscribe();

    // Subscribe to ALL team changes (broader subscription)
    const teamsSubscription = supabase
      .channel("teams_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
        },
        (payload) => {
          console.log("Any team changed:", payload);
          fetchUserTeams();
        }
      )
      .subscribe();

    // Subscribe to team_invitations changes (to catch when invitations are accepted)
    const invitationsSubscription = supabase
      .channel("team_invitations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_invitations",
        },
        (payload) => {
          console.log("Team invitation changed:", payload);
          // Refresh teams and members when invitations change
          fetchUserTeams();
          if (selectedTeam) {
            fetchTeamMembers(selectedTeam.id);
          }
        }
      )
      .subscribe();

    // Also add periodic refresh every 15 seconds as backup (more frequent)
    const intervalId = setInterval(() => {
      console.log("Periodic refresh triggered");
      refreshAllData();
    }, 15000);

    // Cleanup subscriptions and interval
    return () => {
      console.log("Cleaning up subscriptions");
      teamMembersSubscription.unsubscribe();
      teamsSubscription.unsubscribe();
      invitationsSubscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [user, selectedTeam]);

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
        } pt-24 md:pt-20`}
      >
        {/* Page Header */}
        <div className="px-4 md:px-8 pb-6 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1
                  className={`text-2xl md:text-3xl font-bold mb-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Team Collaboration
                </h1>
                <p
                  className={`text-sm md:text-base ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Manage your teams and collaborate on video projects
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={refreshAllData}
                  className="px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium bg-gray-600 hover:bg-gray-700 text-white transition-all duration-300"
                  title="Refresh teams and members"
                >
                  ↻ Refresh
                </button>
                {subscriptionData?.subscriptionStatus === "BUSINESS" && (
                  <button
                    onClick={() => setShowCreateTeam(true)}
                    className="px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300"
                  >
                    Create Team
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 md:px-8 pb-8 md:pb-12">
          <div className="max-w-6xl mx-auto">
            {subscriptionLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span
                  className={`ml-3 ${isDark ? "text-gray-300" : "text-gray-600"}`}
                >
                  Loading subscription...
                </span>
              </div>
            ) : subscriptionData?.subscriptionStatus !== "BUSINESS" ? (
              // Business Plan Required Message
              <div
                className={`rounded-2xl border p-8 text-center ${
                  isDark
                    ? "bg-gray-900/50 border-gray-800"
                    : "bg-white/50 border-gray-200"
                }`}
              >
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 3a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h2
                    className={`text-2xl font-bold mb-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Team Collaboration
                  </h2>
                  <p
                    className={`text-lg mb-6 ${
                      isDark ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Team collaboration features are available with the Business
                    Plan
                  </p>
                  <div
                    className={`rounded-lg p-4 mb-6 ${
                      isDark ? "bg-gray-800/50" : "bg-gray-50"
                    }`}
                  >
                    <h3
                      className={`font-semibold mb-2 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Business Plan Features:
                    </h3>
                    <ul
                      className={`text-sm space-y-1 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      <li>• Create and manage teams</li>
                      <li>• Invite team members</li>
                      <li>• Share videos with teams</li>
                      <li>• Manage member roles and permissions</li>
                      <li>• Real-time collaboration</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push("/workspace/billing")}
                      className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Upgrade to Business Plan
                    </button>
                    <p
                      className={`text-xs ${
                        isDark ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      Current Plan:{" "}
                      {subscriptionData?.subscriptionStatus || "FREE"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Teams Content for Business Plan Users
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Teams List */}
                <div
                  className={`lg:col-span-1 rounded-2xl border p-6 ${
                    isDark
                      ? "bg-gray-900/50 border-gray-800"
                      : "bg-white/50 border-gray-200"
                  }`}
                >
                  <h2
                    className={`text-lg font-bold mb-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Your Teams ({userTeams.length})
                  </h2>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : userTeams.length === 0 ? (
                    <div className="text-center py-8">
                      <p
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        No teams yet. Create your first team to start
                        collaborating!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userTeams.map((team) => (
                        <div
                          key={team.id}
                          onClick={() => setSelectedTeam(team)}
                          className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                            selectedTeam?.id === team.id
                              ? isDark
                                ? "bg-purple-900/30 border-purple-500"
                                : "bg-purple-100 border-purple-500"
                              : isDark
                                ? "bg-gray-800/50 hover:bg-gray-700/50 border-gray-700"
                                : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                          } border`}
                        >
                          <h3
                            className={`font-medium ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {team.name}
                          </h3>
                          <p
                            className={`text-xs mt-1 ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Role: {team.role}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Team Details */}
                <div className="lg:col-span-2 space-y-6">
                  {selectedTeam ? (
                    <>
                      {/* Team Info */}
                      <div
                        className={`rounded-2xl border p-6 ${
                          isDark
                            ? "bg-gray-900/50 border-gray-800"
                            : "bg-white/50 border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h2
                              className={`text-xl font-bold ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {selectedTeam.name}
                            </h2>
                            {selectedTeam.description && (
                              <p
                                className={`mt-2 ${
                                  isDark ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                {selectedTeam.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {isCurrentUserAdmin() && (
                              <>
                                <button
                                  onClick={() => setShowInviteMember(true)}
                                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                  Invite Member
                                </button>
                                <button
                                  onClick={() => setShowShareVideo(true)}
                                  className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                >
                                  Share Video
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Team Members */}
                      <div
                        className={`rounded-2xl border p-6 ${
                          isDark
                            ? "bg-gray-900/50 border-gray-800"
                            : "bg-white/50 border-gray-200"
                        }`}
                      >
                        <h3
                          className={`text-lg font-bold mb-4 ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Team Members ({teamMembers.length})
                        </h3>

                        <div className="space-y-3">
                          {teamMembers.map((member) => (
                            <div
                              key={member.id}
                              className={`flex items-center justify-between p-4 rounded-lg ${
                                isDark ? "bg-gray-800/50" : "bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {member.user?.full_name
                                    ?.substring(0, 2)
                                    .toUpperCase() || "??"}
                                </div>
                                <div>
                                  <p
                                    className={`font-medium ${
                                      isDark ? "text-white" : "text-gray-900"
                                    }`}
                                  >
                                    {member.user?.full_name || "Unknown User"}
                                  </p>
                                  <p
                                    className={`text-sm ${
                                      isDark ? "text-gray-400" : "text-gray-600"
                                    }`}
                                  >
                                    {member.user?.email || "No email"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {editingMemberRole === member.id ? (
                                  // Role editing controls
                                  <div className="flex items-center space-x-2">
                                    <select
                                      value={newRole}
                                      onChange={(e) =>
                                        setNewRole(
                                          e.target.value as
                                            | "admin"
                                            | "editor"
                                            | "member"
                                        )
                                      }
                                      className={`px-2 py-1 text-xs rounded border ${
                                        isDark
                                          ? "bg-gray-700 border-gray-600 text-white"
                                          : "bg-white border-gray-300 text-gray-900"
                                      }`}
                                    >
                                      <option value="member">Member</option>
                                      <option value="editor">Editor</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                    <button
                                      onClick={() =>
                                        handleUpdateMemberRole(
                                          member.id,
                                          member.user_id,
                                          member.role
                                        )
                                      }
                                      className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelRoleEdit}
                                      className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  // Role display with edit option
                                  <div className="flex items-center space-x-2">
                                    <span
                                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                                        member.role === "admin"
                                          ? "bg-purple-100 text-purple-700"
                                          : member.role === "editor"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {member.role}
                                    </span>
                                    {isCurrentUserAdmin() &&
                                      member.user_id !== user?.id && (
                                        <button
                                          onClick={() =>
                                            handleStartRoleEdit(
                                              member.id,
                                              member.role as
                                                | "admin"
                                                | "editor"
                                                | "member"
                                            )
                                          }
                                          className={`px-2 py-1 text-xs rounded ${
                                            isDark
                                              ? "bg-gray-700 hover:bg-gray-600 text-white"
                                              : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                                          }`}
                                        >
                                          Edit
                                        </button>
                                      )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Team Videos */}
                      <div
                        className={`rounded-2xl border p-6 ${
                          isDark
                            ? "bg-gray-900/50 border-gray-800"
                            : "bg-white/50 border-gray-200"
                        }`}
                      >
                        <h3
                          className={`text-lg font-bold mb-4 ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Shared Videos ({teamVideos.length})
                        </h3>

                        {teamVideos.length === 0 ? (
                          <div className="text-center py-8">
                            <p
                              className={`text-sm ${
                                isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              No videos shared with this team yet.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {teamVideos.map((video) => (
                              <div
                                key={video.video.id}
                                className={`flex items-center justify-between p-4 rounded-lg ${
                                  isDark ? "bg-gray-800/50" : "bg-gray-50"
                                }`}
                              >
                                <div>
                                  <p
                                    className={`font-medium ${
                                      isDark ? "text-white" : "text-gray-900"
                                    }`}
                                  >
                                    {video.video.filename}
                                  </p>
                                  <p
                                    className={`text-sm ${
                                      isDark ? "text-gray-400" : "text-gray-600"
                                    }`}
                                  >
                                    Shared by{" "}
                                    {video.userInfo?.full_name ||
                                      `User ${video.video.user_id?.substring(0, 8)}...`}{" "}
                                    • {video.permissions}
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    router.push(`/videos/${video.video.id}`)
                                  }
                                  className={`text-sm px-3 py-1 rounded ${
                                    isDark
                                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                                  }`}
                                >
                                  View
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div
                      className={`rounded-2xl border p-8 text-center ${
                        isDark
                          ? "bg-gray-900/50 border-gray-800"
                          : "bg-white/50 border-gray-200"
                      }`}
                    >
                      <p
                        className={`${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Select a team to view details and manage members.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            className={`w-full max-w-md rounded-xl shadow-lg border ${
              isDark
                ? "bg-gray-900 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="p-6">
              <h3
                className={`text-lg font-bold mb-4 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Create New Team
              </h3>

              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    placeholder="Describe your team's purpose"
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateTeam(false)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTeam}
                  className="flex-1 px-4 py-2 rounded-lg font-medium bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Create Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            className={`w-full max-w-md rounded-xl shadow-lg border ${
              isDark
                ? "bg-gray-900 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="p-6">
              <h3
                className={`text-lg font-bold mb-4 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Invite Team Member
              </h3>

              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
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
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="member">Member</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowInviteMember(false)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteMember}
                  className="flex-1 px-4 py-2 rounded-lg font-medium bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Video Modal */}
      {showShareVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            className={`w-full max-w-md rounded-xl shadow-lg border ${
              isDark
                ? "bg-gray-900 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="p-6">
              <h3
                className={`text-lg font-bold mb-4 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Share Video with Team
              </h3>

              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Select Video
                  </label>
                  <select
                    value={selectedVideoId}
                    onChange={(e) => setSelectedVideoId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="">Choose a video...</option>
                    {userVideos.map((video) => (
                      <option key={video.id} value={video.id}>
                        {video.filename}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowShareVideo(false)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleShareVideo}
                  className="flex-1 px-4 py-2 rounded-lg font-medium bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Share Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
