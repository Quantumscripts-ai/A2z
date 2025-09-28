-- Disable Row Level Security on collaboration tables
-- This will allow all authenticated users to access the tables without policy restrictions

-- Disable RLS on teams table
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;

-- Disable RLS on team_members table
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;

-- Disable RLS on team_invitations table
ALTER TABLE public.team_invitations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on team_videos table
ALTER TABLE public.team_videos DISABLE ROW LEVEL SECURITY;

-- Disable RLS on notification_preferences table
ALTER TABLE public.notification_preferences DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies (they won't be needed anymore)
DROP POLICY IF EXISTS "Users can view teams they admin" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Team admins can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams where they are members" ON public.teams;

DROP POLICY IF EXISTS "Users can view their own team memberships" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can view all team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can delete team members" ON public.team_members;

DROP POLICY IF EXISTS "Users can view invitations they sent" ON public.team_invitations;
DROP POLICY IF EXISTS "Users can view invitations they received" ON public.team_invitations;
DROP POLICY IF EXISTS "Team admins can create invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Users can update their own invitations" ON public.team_invitations;

DROP POLICY IF EXISTS "Team members can view team videos" ON public.team_videos;
DROP POLICY IF EXISTS "Team admins can manage team videos" ON public.team_videos;

-- Note: With RLS disabled, you'll need to handle access control in your application code
-- Make sure to check user permissions in your API routes and functions
