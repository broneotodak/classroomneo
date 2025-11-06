-- ==========================================
-- FIX: Admins Can't Read Student Profiles
-- ==========================================

-- Problem: Admin queries return NULL even though profiles exist
-- Cause: RLS policies blocking admin from reading student profiles
-- Solution: Update SELECT policies to allow admins/trainers to view all profiles

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Users view own profile" ON users_profile;
DROP POLICY IF EXISTS "Trainers view all profiles" ON users_profile;
DROP POLICY IF EXISTS "Admins and trainers can view all profiles" ON users_profile;

-- Allow users to view their OWN profile
CREATE POLICY "Users view own profile" ON users_profile
  FOR SELECT USING (
    id = auth.uid()
  );

-- Allow admins and trainers to view ALL profiles
CREATE POLICY "Admins and trainers view all profiles" ON users_profile
  FOR SELECT USING (
    -- Check if the CURRENT user (the one making the query) is admin/trainer
    EXISTS (
      SELECT 1 FROM users_profile requester
      WHERE requester.id = auth.uid()
      AND requester.role IN ('admin', 'trainer')
    )
  );

-- Verify policies
SELECT 
  policyname,
  cmd,
  qual::text as using_clause
FROM pg_policies 
WHERE tablename = 'users_profile'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- Test query (should work now for admins)
SELECT 
  id,
  github_username,
  role
FROM users_profile
ORDER BY created_at DESC
LIMIT 5;

SELECT '✅ Admins can now read all student profiles!' as result;

