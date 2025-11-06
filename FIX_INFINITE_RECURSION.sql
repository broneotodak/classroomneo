-- ==========================================
-- FIX: Infinite Recursion in users_profile Policy
-- ==========================================

-- The issue: "Trainers view all profiles" policy checks users_profile
-- which triggers the same policy = infinite loop!

-- Solution: Use a simpler approach without recursion

-- Drop problematic policies
DROP POLICY IF EXISTS "Users view own profile" ON users_profile;
DROP POLICY IF EXISTS "Trainers view all profiles" ON users_profile;
DROP POLICY IF EXISTS "Users update own profile" ON users_profile;
DROP POLICY IF EXISTS "Users insert own profile" ON users_profile;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own profile" ON users_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins and trainers can view all profiles" ON users_profile
  FOR SELECT USING (
    role IN ('admin', 'trainer')
  );

CREATE POLICY "Users can update own profile" ON users_profile
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON users_profile
  FOR UPDATE USING (role = 'admin');

CREATE POLICY "Users can insert own profile" ON users_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Verify
SELECT 'Policies fixed! No more infinite recursion.' as result;

