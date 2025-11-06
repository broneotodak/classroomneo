-- ==========================================
-- FIX: Grades Table RLS Policies
-- ==========================================

-- The AI successfully created the grade, but users can't read it
-- because of missing RLS SELECT policies

-- Drop existing policies if any
DROP POLICY IF EXISTS "Students view own grades" ON grades;
DROP POLICY IF EXISTS "Trainers view all grades" ON grades;
DROP POLICY IF EXISTS "Admins view all grades" ON grades;

-- Allow students to view their own grades
CREATE POLICY "Students view own grades" ON grades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE submissions.id = grades.submission_id
      AND submissions.student_id = auth.uid()
    )
  );

-- Allow trainers and admins to view all grades
CREATE POLICY "Trainers and admins view all grades" ON grades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role IN ('trainer', 'admin')
    )
  );

-- Allow trainers and admins to insert grades (manual grading)
DROP POLICY IF EXISTS "Trainers insert grades" ON grades;
CREATE POLICY "Trainers insert grades" ON grades
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role IN ('trainer', 'admin')
    )
  );

-- Allow trainers and admins to update grades (corrections)
DROP POLICY IF EXISTS "Trainers update grades" ON grades;
CREATE POLICY "Trainers update grades" ON grades
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role IN ('trainer', 'admin')
    )
  );

-- Verify policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'grades'
ORDER BY policyname;

-- Test query (should work now)
SELECT 'Grades RLS policies fixed! Students can now view their grades.' as result;

