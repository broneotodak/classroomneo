-- ==========================================
-- SIMPLE FIX: Allow Students to View Classes
-- ==========================================

-- The issue: Students can't see classes because of missing RLS policy

-- Step 1: Add policy for students to view all active classes
DROP POLICY IF EXISTS "Anyone can view active classes" ON classes;

CREATE POLICY "Students can view active classes" ON classes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins and trainers can view all classes" ON classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Step 2: Verify policies work
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'classes'
ORDER BY policyname;

-- Step 3: Test if students can now see classes
SELECT * FROM classes WHERE is_active = true LIMIT 5;

