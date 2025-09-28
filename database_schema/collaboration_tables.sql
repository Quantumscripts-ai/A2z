-- Teams table - for organizing collaborators
CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(255) NOT NULL,
  description text NULL,
  admin_user_id uuid NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  is_active boolean NULL DEFAULT true,
  team_code character varying(10) UNIQUE, -- Optional: for easy team joining
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Team members table - who belongs to which team
CREATE TABLE public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamp with time zone NULL DEFAULT now(),
  is_active boolean NULL DEFAULT true,
  CONSTRAINT team_members_pkey PRIMARY KEY (id),
  CONSTRAINT team_members_unique UNIQUE (team_id, user_id),
  CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT team_members_role_check CHECK (role IN ('admin', 'editor', 'viewer', 'member'))
);

-- Team invitations table - pending invitations
CREATE TABLE public.team_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  inviter_user_id uuid NOT NULL,
  invited_email character varying(255) NOT NULL,
  invited_user_id uuid NULL, -- NULL if user doesn't exist yet
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'pending',
  invitation_token character varying(64) UNIQUE NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  responded_at timestamp with time zone NULL,
  CONSTRAINT team_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT team_invitations_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT team_invitations_inviter_user_id_fkey FOREIGN KEY (inviter_user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT team_invitations_invited_user_id_fkey FOREIGN KEY (invited_user_id) REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT team_invitations_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  CONSTRAINT team_invitations_role_check CHECK (role IN ('admin', 'editor', 'viewer', 'member'))
);

-- Team videos table - which videos are shared with which teams
CREATE TABLE public.team_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  video_id uuid NOT NULL,
  shared_by_user_id uuid NOT NULL,
  shared_at timestamp with time zone NULL DEFAULT now(),
  permissions text NOT NULL DEFAULT 'view', -- view, edit, download
  CONSTRAINT team_videos_pkey PRIMARY KEY (id),
  CONSTRAINT team_videos_unique UNIQUE (team_id, video_id),
  CONSTRAINT team_videos_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT team_videos_video_id_fkey FOREIGN KEY (video_id) REFERENCES videos (id) ON DELETE CASCADE,
  CONSTRAINT team_videos_shared_by_user_id_fkey FOREIGN KEY (shared_by_user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT team_videos_permissions_check CHECK (permissions IN ('view', 'edit', 'download', 'full'))
);

-- Notification preferences table - for email notifications
CREATE TABLE public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email_invitations boolean DEFAULT true,
  email_team_updates boolean DEFAULT true,
  email_video_shares boolean DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT notification_preferences_user_id_unique UNIQUE (user_id),
  CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_admin_user_id ON public.teams USING btree (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members USING btree (team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON public.team_invitations USING btree (team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations USING btree (invited_email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations USING btree (invitation_token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations USING btree (status);
CREATE INDEX IF NOT EXISTS idx_team_videos_team_id ON public.team_videos USING btree (team_id);
CREATE INDEX IF NOT EXISTS idx_team_videos_video_id ON public.team_videos USING btree (video_id);

-- RLS Policies (Row Level Security)

-- Teams: Users can see teams they're members of or admin of
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view teams they belong to" ON public.teams
FOR SELECT USING (
  auth.uid() = admin_user_id OR 
  auth.uid() IN (
    SELECT user_id FROM public.team_members 
    WHERE team_id = teams.id AND is_active = true
  )
);

CREATE POLICY "Users can create teams" ON public.teams
FOR INSERT WITH CHECK (auth.uid() = admin_user_id);

CREATE POLICY "Team admins can update their teams" ON public.teams
FOR UPDATE USING (auth.uid() = admin_user_id);

-- Team Members: Users can see members of teams they belong to
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team members of their teams" ON public.team_members
FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM public.team_members tm2 
    WHERE tm2.team_id = team_members.team_id AND tm2.is_active = true
  )
);

-- Team Invitations: Users can see invitations they sent or received
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations they sent or received" ON public.team_invitations
FOR SELECT USING (
  auth.uid() = inviter_user_id OR 
  auth.uid() = invited_user_id OR
  (SELECT email FROM auth.users WHERE id = auth.uid()) = invited_email
);

-- Team Videos: Users can see videos shared with their teams
ALTER TABLE public.team_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team videos of their teams" ON public.team_videos
FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM public.team_members 
    WHERE team_id = team_videos.team_id AND is_active = true
  )
);

-- Functions for automatic triggers

-- Function to add team creator as admin member
CREATE OR REPLACE FUNCTION add_team_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.admin_user_id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically add team creator as admin
CREATE TRIGGER add_team_creator_trigger
  AFTER INSERT ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION add_team_creator_as_admin();

-- Function to update team updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating team timestamp
CREATE TRIGGER update_team_timestamp_trigger
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION update_team_timestamp();
