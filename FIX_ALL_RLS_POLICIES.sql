-- ==========================================
-- FIX ALL RLS POLICIES - Complete Fix
-- ==========================================

-- This fixes all 406 errors by ensuring proper RLS policies
-- for assignments, grades, and user profiles

-- ===================
-- 1. ASSIGNMENTS TABLE
-- ===================

-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can view active assignments" ON assignments;
DROP POLICY IF EXISTS "Students view assignments" ON assignments;
DROP POLICY IF EXISTS "Trainers manage assignments" ON assignments;

-- Allow EVERYONE (authenticated users) to view active assignments
CREATE POLICY "Everyone can view active assignments" ON assignments
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );

-- Allow trainers/admins to insert assignments
CREATE POLICY "Trainers create assignments" ON assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role IN ('trainer', 'admin')
    )
  );

-- Allow trainers/admins to update assignments
CREATE POLICY "Trainers update assignments" ON assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role IN ('trainer', 'admin')
    )
  );

-- ===================
-- 2. GRADES TABLE (Fix)
-- ===================

-- Drop existing policies
DROP POLICY IF EXISTS "Students view own grades" ON grades;
DROP POLICY IF EXISTS "Trainers and admins view all grades" ON grades;
DROP POLICY IF EXISTS "Trainers insert grades" ON grades;
DROP POLICY IF EXISTS "Trainers update grades" ON grades;

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

-- Allow trainers, admins, AND the AI system (service_role) to insert grades
CREATE POLICY "Trainers and system insert grades" ON grades
  FOR INSERT WITH CHECK (
    -- Allow if user is trainer/admin OR if it's the system (AI)
    (
      EXISTS (
        SELECT 1 FROM users_profile
        WHERE users_profile.id = auth.uid()
        AND users_profile.role IN ('trainer', 'admin')
      )
    )
    OR
    -- Allow service role (for AI grading from Netlify Function)
    auth.jwt() ->> 'role' = 'service_role'
    OR
    -- Allow if graded_by is NULL (AI grading)
    graded_by IS NULL
  );

-- Allow trainers and admins to update grades
CREATE POLICY "Trainers update grades" ON grades
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role IN ('trainer', 'admin')
    )
  );

-- ===================
-- 3. USERS_PROFILE TABLE (Fix)
-- ===================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;
DROP POLICY IF EXISTS "Admins and trainers can view all profiles" ON users_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON users_profile;
DROP POLICY IF EXISTS "Admins can update any profile" ON users_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON users_profile;

-- Allow users to view their own profile
CREATE POLICY "Users view own profile" ON users_profile
  FOR SELECT USING (id = auth.uid());

-- Allow trainers/admins to view all profiles
CREATE POLICY "Trainers view all profiles" ON users_profile
  FOR SELECT USING (
    role IN ('trainer', 'admin')
  );

-- Allow users to update own profile
CREATE POLICY "Users update own profile" ON users_profile
  FOR UPDATE USING (id = auth.uid());

-- Allow admins to update any profile
CREATE POLICY "Admins update profiles" ON users_profile
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- Allow users to insert own profile
CREATE POLICY "Users insert own profile" ON users_profile
  FOR INSERT WITH CHECK (id = auth.uid());

-- ===================
-- 4. SUBMISSIONS TABLE (Verify)
-- ===================

-- Drop and recreate submission policies
DROP POLICY IF EXISTS "Students view own submissions" ON submissions;
DROP POLICY IF EXISTS "Trainers view all submissions" ON submissions;
DROP POLICY IF EXISTS "Students insert own submissions" ON submissions;
DROP POLICY IF EXISTS "Students update own submissions" ON submissions;

-- Students can view their own submissions
CREATE POLICY "Students view own submissions" ON submissions
  FOR SELECT USING (student_id = auth.uid());

-- Trainers/admins can view all submissions
CREATE POLICY "Trainers view all submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role IN ('trainer', 'admin')
    )
  );

-- Students can insert their own submissions
CREATE POLICY "Students insert own submissions" ON submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students and trainers can update submissions (for status changes)
CREATE POLICY "Students and trainers update submissions" ON submissions
  FOR UPDATE USING (
    student_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role IN ('trainer', 'admin')
    )
  );

-- ===================
-- VERIFICATION
-- ===================

-- Verify all policies
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_check,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK'
  END as with_check_status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('assignments', 'grades', 'users_profile', 'submissions')
ORDER BY tablename, policyname;

-- Fix any stuck submissions (have grades but status is still pending)
UPDATE submissions
SET 
  status = 'graded',
  graded_at = NOW()
WHERE id IN (
  SELECT s.id 
  FROM submissions s
  JOIN grades g ON g.submission_id = s.id
  WHERE s.status != 'graded'
)
RETURNING id, status;

SELECT '✅ All RLS policies fixed! Users should now see assignments and grades.' as result;

