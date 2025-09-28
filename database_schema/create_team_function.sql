-- Function to create team and add admin member (bypasses RLS)
CREATE OR REPLACE FUNCTION create_team_with_admin(
  team_name text,
  team_description text DEFAULT NULL,
  admin_id uuid DEFAULT auth.uid()
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_team_id uuid;
  result json;
BEGIN
  -- Check if user is authenticated
  IF admin_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Insert team
  INSERT INTO public.teams (name, description, admin_user_id)
  VALUES (team_name, team_description, admin_id)
  RETURNING id INTO new_team_id;

  -- Insert admin as team member
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, admin_id, 'admin');

  -- Return success
  result := json_build_object(
    'success', true,
    'team_id', new_team_id,
    'message', 'Team created successfully'
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  -- Return error
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_team_with_admin TO authenticated;
