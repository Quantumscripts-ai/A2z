-- Fixed RLS Policies to prevent infinite recursion

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Team admins can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view team members of their teams" ON public.team_members;
DROP POLICY IF EXISTS "Users can view invitations they sent or received" ON public.team_invitations;
DROP POLICY IF EXISTS "Users can view team videos of their teams" ON public.team_videos;

-- Teams policies - Fixed to avoid recursion
CREATE POLICY "Users can view teams they admin" ON public.teams
FOR SELECT USING (auth.uid() = admin_user_id);

CREATE POLICY "Users can create teams" ON public.teams
FOR INSERT WITH CHECK (auth.uid() = admin_user_id);

CREATE POLICY "Team admins can update their teams" ON public.teams
FOR UPDATE USING (auth.uid() = admin_user_id);

-- Team Members policies - Fixed to avoid recursion
CREATE POLICY "Users can view their own team memberships" ON public.team_members
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Team admins can view all team members" ON public.team_members
FOR SELECT USING (
  auth.uid() IN (
    SELECT admin_user_id FROM public.teams 
    WHERE id = team_members.team_id
  )
);

CREATE POLICY "Team admins can insert team members" ON public.team_members
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT admin_user_id FROM public.teams 
    WHERE id = team_members.team_id
  )
);

CREATE POLICY "Team admins can update team members" ON public.team_members
FOR UPDATE USING (
  auth.uid() IN (
    SELECT admin_user_id FROM public.teams 
    WHERE id = team_members.team_id
  )
);

CREATE POLICY "Team admins can delete team members" ON public.team_members
FOR DELETE USING (
  auth.uid() IN (
    SELECT admin_user_id FROM public.teams 
    WHERE id = team_members.team_id
  )
);

-- Team Invitations policies
CREATE POLICY "Users can view invitations they sent" ON public.team_invitations
FOR SELECT USING (auth.uid() = inviter_user_id);

CREATE POLICY "Users can view invitations they received" ON public.team_invitations
FOR SELECT USING (
  auth.uid() = invited_user_id OR
  (SELECT email FROM auth.users WHERE id = auth.uid()) = invited_email
);

CREATE POLICY "Team admins can create invitations" ON public.team_invitations
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT admin_user_id FROM public.teams 
    WHERE id = team_invitations.team_id
  )
);

CREATE POLICY "Users can update their own invitations" ON public.team_invitations
FOR UPDATE USING (
  auth.uid() = invited_user_id OR
  (SELECT email FROM auth.users WHERE id = auth.uid()) = invited_email
);

-- Team Videos policies
CREATE POLICY "Team members can view team videos" ON public.team_videos
FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM public.team_members 
    WHERE team_id = team_videos.team_id AND is_active = true
  ) OR
  auth.uid() IN (
    SELECT admin_user_id FROM public.teams 
    WHERE id = team_videos.team_id
  )
);

CREATE POLICY "Team admins can manage team videos" ON public.team_videos
FOR ALL USING (
  auth.uid() IN (
    SELECT admin_user_id FROM public.teams 
    WHERE id = team_videos.team_id
  )
);

-- Additional policy to allow users to see teams they're members of (separate query)
CREATE POLICY "Users can view teams where they are members" ON public.teams
FOR SELECT USING (
  id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);
