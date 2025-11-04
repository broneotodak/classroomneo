-- ==========================================
-- FIX: Admin Roster View Permissions
-- ==========================================
-- Run this in Supabase SQL Editor to fix the "Failed to load student roster" error

-- Drop and recreate the view with proper permissions
DROP VIEW IF EXISTS admin_student_roster;

-- Recreate the view
CREATE VIEW admin_student_roster AS
SELECT 
  u.id,
  u.github_username,
  u.github_avatar_url,
  u.email,
  u.full_name,
  u.role,
  u.created_at,
  u.last_login,
  ce.class_id,
  c.name as class_name,
  COUNT(DISTINCT up.id) as total_steps_started,
  COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.id END) as steps_completed,
  ROUND(
    (COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.id END)::NUMERIC / 
     NULLIF(COUNT(DISTINCT up.id), 0)) * 100,
    2
  ) as overall_completion_percentage
FROM users_profile u
LEFT JOIN class_enrollments ce ON ce.student_id = u.id AND ce.status = 'active'
LEFT JOIN classes c ON c.id = ce.class_id
LEFT JOIN user_progress up ON up.user_id = u.id
WHERE u.role = 'student'
GROUP BY u.id, u.github_username, u.github_avatar_url, u.email, u.full_name, u.role, u.created_at, u.last_login, ce.class_id, c.name;

-- Grant proper access
GRANT SELECT ON admin_student_roster TO authenticated;
GRANT SELECT ON admin_student_roster TO anon;

-- Add RLS policy for the view (views need policies too!)
ALTER VIEW admin_student_roster SET (security_invoker = on);

-- Alternative: Create a function instead of view (more reliable with RLS)
CREATE OR REPLACE FUNCTION get_student_roster()
RETURNS TABLE (
  id UUID,
  github_username TEXT,
  github_avatar_url TEXT,
  email TEXT,
  full_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  class_id INTEGER,
  class_name TEXT,
  total_steps_started BIGINT,
  steps_completed BIGINT,
  overall_completion_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin or trainer
  IF NOT EXISTS (
    SELECT 1 FROM users_profile 
    WHERE users_profile.id = auth.uid() 
    AND users_profile.role IN ('admin', 'trainer')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin or trainer role required.';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.github_username,
    u.github_avatar_url,
    u.email,
    u.full_name,
    u.role,
    u.created_at,
    u.last_login,
    ce.class_id,
    c.name as class_name,
    COUNT(DISTINCT up.id) as total_steps_started,
    COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.id END) as steps_completed,
    ROUND(
      (COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.id END)::NUMERIC / 
       NULLIF(COUNT(DISTINCT up.id), 0)) * 100,
      2
    ) as overall_completion_percentage
  FROM users_profile u
  LEFT JOIN class_enrollments ce ON ce.student_id = u.id AND ce.status = 'active'
  LEFT JOIN classes c ON c.id = ce.class_id
  LEFT JOIN user_progress up ON up.user_id = u.id
  WHERE u.role = 'student'
  GROUP BY u.id, u.github_username, u.github_avatar_url, u.email, u.full_name, u.role, u.created_at, u.last_login, ce.class_id, c.name;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_student_roster() TO authenticated;

-- Optional: Keep the view but make it simpler
-- This way the app can use either the view or the function

