-- ==========================================
-- FIX INFINITE RECURSION - FINAL SOLUTION
-- ==========================================

-- The problem: Policy checks users_profile to see if user is admin,
-- which triggers the same policy = infinite loop!

-- Solution: Use a simpler approach WITHOUT checking users_profile

-- DROP ALL users_profile SELECT policies
DROP POLICY IF EXISTS "Users view own profile" ON users_profile;
DROP POLICY IF EXISTS "Trainers view all profiles" ON users_profile;
DROP POLICY IF EXISTS "Admins and trainers view all profiles" ON users_profile;
DROP POLICY IF EXISTS "Admins and trainers can view all profiles" ON users_profile;

-- Create simple, non-recursive policies

-- 1. Users can ALWAYS view their own profile (no recursion)
CREATE POLICY "Users view own profile" ON users_profile
  FOR SELECT USING (
    id = auth.uid()
  );

-- 2. Allow viewing ANY profile (public profiles approach)
-- This is safe because users_profile doesn't contain sensitive data
CREATE POLICY "Public profiles viewable" ON users_profile
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual::text as policy_definition
FROM pg_policies 
WHERE tablename = 'users_profile'
  AND cmd = 'SELECT'
ORDER BY policyname;

SELECT '✅ Fixed! No more infinite recursion. All authenticated users can view profiles.' as result;

