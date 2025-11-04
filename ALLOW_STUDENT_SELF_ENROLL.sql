-- ==========================================
-- Allow Students to Self-Enroll in Classes
-- ==========================================
-- Run this in Supabase SQL Editor

-- Add policy to allow students to enroll themselves
-- Drop first if exists, then create
DROP POLICY IF EXISTS "Students can enroll themselves" ON class_enrollments;

CREATE POLICY "Students can enroll themselves" ON class_enrollments
  FOR INSERT 
  WITH CHECK (
    student_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Verify policies
SELECT 
  schemaname, 
  tablename, 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'class_enrollments'
ORDER BY policyname;

