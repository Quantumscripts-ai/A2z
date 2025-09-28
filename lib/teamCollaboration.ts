import { supabase } from "./supabase";

// Check if user has business plan access
async function checkBusinessPlanAccess(
  userId: string
): Promise<{ hasAccess: boolean; error?: string }> {
  try {
    // Get auth token
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return { hasAccess: false, error: "No active session" };
    }

    // Fetch subscription data from API
    const response = await fetch("/api/user/subscription", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      return { hasAccess: false, error: "Failed to fetch subscription data" };
    }

    const subscriptionData = await response.json();
    return {
      hasAccess: subscriptionData.subscriptionStatus === "BUSINESS",
    };
  } catch (error) {
    console.error("Error checking business plan access:", error);
    return { hasAccess: false, error: "Failed to check subscription" };
  }
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  inviter_user_id: string;
  invited_email: string;
  invited_user_id?: string;
  role: "admin" | "editor" | "viewer" | "member";
  status: "pending" | "accepted" | "declined" | "expired";
  invitation_token: string;
  expires_at: string;
  created_at: string;
  team: {
    name: string;
    description?: string;
  };
  inviter: {
    full_name: string;
    email: string;
  };
}

// Generate a secure random token for invitations
function generateInvitationToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

// Helper function to get user information by user ID
export async function getUserInfo(
  userId: string
): Promise<{ full_name: string; email: string }> {
  try {
    // Get current user if it's the same user
    const { data: currentUser } = await supabase.auth.getUser();
    if (currentUser.user && currentUser.user.id === userId) {
      return {
        full_name:
          currentUser.user.user_metadata?.full_name ||
          currentUser.user.user_metadata?.name ||
          currentUser.user.email?.split("@")[0] ||
          "Unknown User",
        email: currentUser.user.email || "No email",
      };
    }

    // For other users, use the API
    const response = await fetch("/api/user-info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userIds: [userId] }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user info");
    }

    const { userInfo } = await response.json();
    return (
      userInfo[userId] || {
        full_name: `User ${userId.substring(0, 8)}...`,
        email: "Email not available",
      }
    );
  } catch (error) {
    console.error("Error fetching user info:", error);
    return {
      full_name: `User ${userId.substring(0, 8)}...`,
      email: "Email not available",
    };
  }
}

// Batch function to get multiple user infos
export async function getUserInfoBatch(
  userIds: string[]
): Promise<Record<string, { full_name: string; email: string }>> {
  try {
    // Get current user info first
    const { data: currentUser } = await supabase.auth.getUser();
    const userInfoMap: Record<string, { full_name: string; email: string }> =
      {};

    if (currentUser.user) {
      const currentUserId = currentUser.user.id;
      if (userIds.includes(currentUserId)) {
        userInfoMap[currentUserId] = {
          full_name:
            currentUser.user.user_metadata?.full_name ||
            currentUser.user.user_metadata?.name ||
            currentUser.user.email?.split("@")[0] ||
            "Unknown User",
          email: currentUser.user.email || "No email",
        };
      }
    }

    // Get info for other users via API
    const otherUserIds = userIds.filter((id) => !userInfoMap[id]);

    if (otherUserIds.length > 0) {
      const response = await fetch("/api/user-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds: otherUserIds }),
      });

      if (response.ok) {
        const { userInfo } = await response.json();
        Object.assign(userInfoMap, userInfo);
      }
    }

    // Fill in any missing users with fallback info
    for (const userId of userIds) {
      if (!userInfoMap[userId]) {
        userInfoMap[userId] = {
          full_name: `User ${userId.substring(0, 8)}...`,
          email: "Email not available",
        };
      }
    }

    return userInfoMap;
  } catch (error) {
    console.error("Error fetching user info batch:", error);
    // Return fallback info for all users
    const fallbackMap: Record<string, { full_name: string; email: string }> =
      {};
    for (const userId of userIds) {
      fallbackMap[userId] = {
        full_name: `User ${userId.substring(0, 8)}...`,
        email: "Email not available",
      };
    }
    return fallbackMap;
  }
}

// Create team - simplified without RLS
export async function createTeam(
  name: string,
  description?: string
): Promise<{ success: boolean; teamId?: string; error?: string }> {
  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Check if user has business plan access
    const { hasAccess, error: accessError } = await checkBusinessPlanAccess(
      user.id
    );
    if (!hasAccess) {
      return {
        success: false,
        error:
          accessError ||
          "Business plan required for team collaboration features",
      };
    }

    // Create the team
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .insert({
        name: name,
        description: description,
        admin_user_id: user.id,
      })
      .select()
      .single();

    if (teamError) {
      return { success: false, error: teamError.message };
    }

    // Use upsert to handle potential duplicates gracefully
    const { error: memberError } = await supabase.from("team_members").upsert(
      {
        team_id: teamData.id,
        user_id: user.id,
        role: "admin",
        is_active: true,
      },
      {
        onConflict: "team_id,user_id",
        ignoreDuplicates: false,
      }
    );

    if (memberError) {
      // If adding member fails, try to clean up the team
      await supabase.from("teams").delete().eq("id", teamData.id);
      return { success: false, error: memberError.message };
    }

    return { success: true, teamId: teamData.id };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Create team invitation
export async function createTeamInvitation(
  teamId: string,
  inviterUserId: string,
  invitedEmail: string,
  role: "admin" | "editor" | "viewer" | "member" = "member"
): Promise<{ success: boolean; invitation?: TeamInvitation; error?: string }> {
  try {
    // Check if user has business plan access
    const { hasAccess, error: accessError } =
      await checkBusinessPlanAccess(inviterUserId);
    if (!hasAccess) {
      return {
        success: false,
        error:
          accessError ||
          "Business plan required for team collaboration features",
      };
    }

    // Check if user is already a team member
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", inviterUserId)
      .eq("is_active", true)
      .single();

    if (!existingMember) {
      return {
        success: false,
        error: "You are not authorized to invite to this team",
      };
    }

    // Check if invitation already exists and is pending
    const { data: existingInvitation } = await supabase
      .from("team_invitations")
      .select("id, status")
      .eq("team_id", teamId)
      .eq("invited_email", invitedEmail)
      .eq("status", "pending")
      .single();

    if (existingInvitation) {
      return { success: false, error: "Invitation already sent to this email" };
    }

    // Generate invitation token and expiry
    const invitationToken = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Create invitation (we'll check user existence during acceptance)
    const { data: invitation, error } = await supabase
      .from("team_invitations")
      .insert({
        team_id: teamId,
        inviter_user_id: inviterUserId,
        invited_email: invitedEmail,
        invited_user_id: null, // Will be set when user accepts
        role,
        invitation_token: invitationToken,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Get team details
    const { data: teamData } = await supabase
      .from("teams")
      .select("name, description")
      .eq("id", teamId)
      .single();

    // Get current user info
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    // Construct the invitation object
    const invitationWithDetails = {
      ...invitation,
      team: teamData || { name: "", description: "" },
      inviter: {
        full_name: currentUser?.user_metadata?.full_name || "Unknown",
        email: currentUser?.email || "",
      },
    };

    // Send email invitation
    const emailSent = await sendInvitationEmail(invitationWithDetails);

    if (!emailSent.success) {
      // If email fails, we might want to delete the invitation or mark it as failed
      console.error("Failed to send invitation email:", emailSent.error);
      return {
        success: false,
        error: `Invitation created but email failed: ${emailSent.error}`,
      };
    }

    return { success: true, invitation: invitationWithDetails };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Send invitation email
async function sendInvitationEmail(invitation: {
  id: string;
  email: string;
  invitation_token: string;
  team_name?: string;
  inviter_name?: string;
  role: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${invitation.invitation_token}`;
    const declineUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/decline?token=${invitation.invitation_token}`;

    // Call your email service (this could be Supabase Edge Function, Resend, SendGrid, etc.)
    const response = await fetch("/api/send-invitation-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: invitation.email,
        teamName: invitation.team_name,
        inviterName: invitation.inviter_name,
        invitationToken: invitation.invitation_token,
        role: invitation.role,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to send email" }));
      throw new Error(errorData.error || "Failed to send email");
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Accept invitation
export async function acceptTeamInvitation(
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("invitation_token", token)
      .eq("status", "pending")
      .single();

    if (inviteError || !invitation) {
      return { success: false, error: "Invalid or expired invitation" };
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from("team_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return { success: false, error: "Invitation has expired" };
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Check if user email matches invitation
    if (user.email !== invitation.invited_email) {
      return {
        success: false,
        error: "Email mismatch. Please log in with the invited email address.",
      };
    }

    // Add user to team
    const { error: memberError } = await supabase.from("team_members").insert({
      team_id: invitation.team_id,
      user_id: user.id,
      role: invitation.role,
    });

    if (memberError) {
      return { success: false, error: memberError.message };
    }

    // Update invitation status
    await supabase
      .from("team_invitations")
      .update({
        status: "accepted",
        responded_at: new Date().toISOString(),
        invited_user_id: user.id,
      })
      .eq("id", invitation.id);

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Decline invitation
export async function declineTeamInvitation(
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update invitation status
    const { error } = await supabase
      .from("team_invitations")
      .update({
        status: "declined",
        responded_at: new Date().toISOString(),
      })
      .eq("invitation_token", token)
      .eq("status", "pending");

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Get user's teams
export async function getUserTeams(userId: string) {
  try {
    // First, get team IDs where user is a member
    const { data: memberData, error: memberError } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (memberError) {
      console.error("Error fetching team memberships:", memberError);
      return { data: null, error: memberError };
    }

    if (!memberData || memberData.length === 0) {
      return { data: [], error: null };
    }

    // Get team details for those teams
    const teamIds = memberData.map((m) => m.team_id);
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select(
        `
        id,
        name,
        description,
        admin_user_id,
        created_at
      `
      )
      .in("id", teamIds);

    if (teamsError) {
      console.error("Error fetching teams:", teamsError);
      return { data: null, error: teamsError };
    }

    // Combine team data with user roles
    const teamsWithRoles = teamsData?.map((team) => {
      const membership = memberData.find((m) => m.team_id === team.id);
      return {
        ...team,
        role: membership?.role || "member",
      };
    });

    return { data: teamsWithRoles, error: null };
  } catch (error) {
    console.error("Error in getUserTeams:", error);
    return { data: null, error: error as Error };
  }
}

// Get team videos
export async function getTeamVideos(teamId: string) {
  const { data, error } = await supabase
    .from("team_videos")
    .select(
      `
      *,
      video:videos (
        id,
        filename,
        status,
        created_at,
        user_id
      )
    `
    )
    .eq("team_id", teamId);

  return { data, error };
}

// Share video with team
export async function shareVideoWithTeam(
  videoId: string,
  teamId: string,
  sharedByUserId: string,
  permissions: "view" | "edit" | "download" | "full" = "view"
) {
  const { data, error } = await supabase.from("team_videos").insert({
    video_id: videoId,
    team_id: teamId,
    shared_by_user_id: sharedByUserId,
    permissions,
  });

  return { data, error };
}

// Update team member role
export async function updateTeamMemberRole(
  teamId: string,
  userId: string,
  newRole: "admin" | "editor" | "member",
  currentUserId: string
) {
  try {
    // First check if the current user is an admin of this team
    const { data: currentUserMember, error: checkError } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", currentUserId)
      .eq("is_active", true)
      .single();

    if (
      checkError ||
      !currentUserMember ||
      currentUserMember.role !== "admin"
    ) {
      return {
        success: false,
        error: "Only team admins can update member roles",
      };
    }

    // Update the member's role
    const { data, error } = await supabase
      .from("team_members")
      .update({ role: newRole })
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error updating team member role:", error);
    return { success: false, error: "Failed to update member role" };
  }
}

// Get video with team access check
export async function getVideoWithTeamAccess(videoId: string, userId: string) {
  try {
    // First try to get the video if user owns it
    const { data: ownedVideo, error: ownedError } = await supabase
      .from("videos")
      .select("*")
      .eq("id", videoId)
      .eq("user_id", userId)
      .single();

    if (!ownedError && ownedVideo) {
      return { data: ownedVideo, error: null, accessType: "owner" };
    }

    // If not owned, check if it's shared with teams the user is a member of
    const { data: sharedVideo, error: sharedError } = await supabase
      .from("team_videos")
      .select(
        `
        *,
        video:videos (*),
        team:teams (
          id,
          name,
          team_members!inner (
            user_id,
            role,
            is_active
          )
        )
      `
      )
      .eq("video_id", videoId)
      .eq("team.team_members.user_id", userId)
      .eq("team.team_members.is_active", true)
      .single();

    if (!sharedError && sharedVideo) {
      // Get the user's role in the team
      const userRole = sharedVideo.team.team_members.find(
        (member: { user_id: string; role: string }) => member.user_id === userId
      )?.role;

      return {
        data: sharedVideo.video,
        error: null,
        accessType: "shared",
        permissions: sharedVideo.permissions,
        userRole: userRole,
      };
    }

    // If neither owned nor shared, return access denied
    return {
      data: null,
      error: { message: "Video not found or access denied" },
      accessType: null,
    };
  } catch (error) {
    console.error("Error checking video access:", error);
    return {
      data: null,
      error: { message: "Failed to check video access" },
      accessType: null,
    };
  }
}
