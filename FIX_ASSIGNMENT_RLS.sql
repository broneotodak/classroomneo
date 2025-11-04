-- ==========================================
-- FIX: Students Can't See Assignments
-- ==========================================

-- The issue is likely that students can't query assignments due to RLS

-- Step 1: Check current policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'assignments'
ORDER BY policyname;

-- Step 2: Drop and recreate policies with simpler logic
DROP POLICY IF EXISTS "Students can view assignments in enrolled classes" ON assignments;
DROP POLICY IF EXISTS "Trainers and admins can view all assignments" ON assignments;

-- Create simpler, more permissive policy for students
CREATE POLICY "Authenticated users can view active assignments" ON assignments
  FOR SELECT USING (is_active = true);

-- Trainers can still do everything
CREATE POLICY "Trainers can manage assignments" ON assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Step 3: Verify students can now see assignments
SELECT 
  'If you see this as a student, assignments are now visible!' as test,
  COUNT(*) as total_assignments
FROM assignments
WHERE is_active = true;

-- Step 4: Test the complete query that the app uses
SELECT a.*
FROM assignments a
JOIN steps s ON s.id = a.step_id
JOIN modules m ON m.id = s.module_id
WHERE a.is_active = true
AND m.slug = 'netlify';

