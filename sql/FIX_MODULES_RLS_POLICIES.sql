-- ==========================================
-- FIX: Add Missing RLS Policies for Modules & Steps
-- ==========================================
-- Issue: Trainers/Admins cannot create, update, or delete modules/steps
-- Solution: Add INSERT, UPDATE, DELETE policies for trainer/admin roles

-- ==========================================
-- MODULES TABLE - Add Missing Policies
-- ==========================================

-- Allow trainers/admins to INSERT modules
CREATE POLICY "Trainers create modules"
ON modules FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid()
    AND role IN ('trainer', 'admin')
  )
);

-- Allow trainers/admins to UPDATE modules
CREATE POLICY "Trainers update modules"
ON modules FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid()
    AND role IN ('trainer', 'admin')
  )
);

-- Allow trainers/admins to DELETE modules
CREATE POLICY "Trainers delete modules"
ON modules FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid()
    AND role IN ('trainer', 'admin')
  )
);

-- ==========================================
-- STEPS TABLE - Add Missing Policies
-- ==========================================

-- Allow trainers/admins to INSERT steps
CREATE POLICY "Trainers create steps"
ON steps FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid()
    AND role IN ('trainer', 'admin')
  )
);

-- Allow trainers/admins to UPDATE steps
CREATE POLICY "Trainers update steps"
ON steps FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid()
    AND role IN ('trainer', 'admin')
  )
);

-- Allow trainers/admins to DELETE steps
CREATE POLICY "Trainers delete steps"
ON steps FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid()
    AND role IN ('trainer', 'admin')
  )
);

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Check all policies for modules table
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('modules', 'steps')
ORDER BY tablename, cmd;

-- Expected output:
-- modules: SELECT (2 policies), INSERT, UPDATE, DELETE
-- steps: SELECT (2 policies), INSERT, UPDATE, DELETE
