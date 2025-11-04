-- ==========================================
-- FIX: Admin Roster - Create Missing Tables First
-- ==========================================
-- Run this in Supabase SQL Editor

-- Step 1: Add role column to users_profile if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'role'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN role TEXT DEFAULT 'student' CHECK (role IN ('student', 'trainer', 'admin'));
  END IF;
END $$;

-- Step 2: Create classes table if it doesn't exist
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create class_enrollments table if it doesn't exist
CREATE TABLE IF NOT EXISTS class_enrollments (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  UNIQUE(class_id, student_id)
);

-- Step 4: Enable RLS on new tables
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;

-- Step 5: Add RLS policies for classes
DROP POLICY IF EXISTS "Anyone can view active classes" ON classes;
CREATE POLICY "Anyone can view active classes" ON classes
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Trainers and admins can create classes" ON classes;
CREATE POLICY "Trainers and admins can create classes" ON classes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role IN ('trainer', 'admin')
    )
  );

DROP POLICY IF EXISTS "Trainers can update their own classes" ON classes;
CREATE POLICY "Trainers can update their own classes" ON classes
  FOR UPDATE USING (
    trainer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 6: Add RLS policies for class_enrollments
DROP POLICY IF EXISTS "Students can view their own enrollments" ON class_enrollments;
CREATE POLICY "Students can view their own enrollments" ON class_enrollments
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can view enrollments in their classes" ON class_enrollments;
CREATE POLICY "Trainers can view enrollments in their classes" ON class_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_enrollments.class_id 
      AND trainer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Trainers and admins can enroll students" ON class_enrollments;
CREATE POLICY "Trainers and admins can enroll students" ON class_enrollments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role IN ('trainer', 'admin')
    )
  );

-- Step 7: Create the get_student_roster function
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

-- Step 8: Grant execute permission
GRANT EXECUTE ON FUNCTION get_student_roster() TO authenticated;

-- Step 9: Verify everything works
SELECT 'Setup complete! Tables created, function ready.' as status;
