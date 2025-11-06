-- ==========================================
-- FIX 406 Error - RLS Policies for Assignments & Submissions
-- ==========================================

-- The 406 error means RLS is blocking the queries
-- Let's simplify ALL policies to be more permissive

-- ==========================================
-- ASSIGNMENTS POLICIES
-- ==========================================

-- Drop all existing
DROP POLICY IF EXISTS "Students can view assignments in enrolled classes" ON assignments;
DROP POLICY IF EXISTS "Trainers and admins can view all assignments" ON assignments;
DROP POLICY IF EXISTS "Authenticated users can view active assignments" ON assignments;
DROP POLICY IF EXISTS "Trainers can manage assignments" ON assignments;
DROP POLICY IF EXISTS "Trainers and admins can create assignments" ON assignments;
DROP POLICY IF EXISTS "Trainers and admins can update assignments" ON assignments;

-- Drop these too just in case
DROP POLICY IF EXISTS "Anyone authenticated can view assignments" ON assignments;
DROP POLICY IF EXISTS "Trainers can insert assignments" ON assignments;
DROP POLICY IF EXISTS "Trainers can update assignments" ON assignments;
DROP POLICY IF EXISTS "Trainers can delete assignments" ON assignments;

-- Create simple policies
CREATE POLICY "Anyone authenticated can view assignments" ON assignments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Trainers can insert assignments" ON assignments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

CREATE POLICY "Trainers can update assignments" ON assignments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

CREATE POLICY "Trainers can delete assignments" ON assignments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

-- ==========================================
-- SUBMISSIONS POLICIES
-- ==========================================

-- Drop all existing
DROP POLICY IF EXISTS "Students can view their own submissions" ON submissions;
DROP POLICY IF EXISTS "Trainers can view submissions in their classes" ON submissions;
DROP POLICY IF EXISTS "Students can submit assignments" ON submissions;
DROP POLICY IF EXISTS "Students can update own pending submissions" ON submissions;
DROP POLICY IF EXISTS "Trainers can update submission status" ON submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON submissions;
DROP POLICY IF EXISTS "Trainers can view all submissions" ON submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON submissions;
DROP POLICY IF EXISTS "Users can update their pending submissions" ON submissions;
DROP POLICY IF EXISTS "Trainers can update any submission" ON submissions;

-- Create simple policies
CREATE POLICY "Users can view their own submissions" ON submissions
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Trainers can view all submissions" ON submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

CREATE POLICY "Users can create submissions" ON submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Users can update their pending submissions" ON submissions
  FOR UPDATE USING (student_id = auth.uid() AND status = 'pending');

CREATE POLICY "Trainers can update any submission" ON submissions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

-- ==========================================
-- GRADES POLICIES
-- ==========================================

-- Drop all existing
DROP POLICY IF EXISTS "Students can view their own grades" ON grades;
DROP POLICY IF EXISTS "Trainers can view grades in their classes" ON grades;
DROP POLICY IF EXISTS "Trainers and system can create grades" ON grades;
DROP POLICY IF EXISTS "Users can view grades for their submissions" ON grades;
DROP POLICY IF EXISTS "Trainers can view all grades" ON grades;
DROP POLICY IF EXISTS "Trainers can update grades" ON grades;

-- Create simple policies
CREATE POLICY "Users can view grades for their submissions" ON grades
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM submissions WHERE id = grades.submission_id AND student_id = auth.uid())
  );

CREATE POLICY "Trainers can view all grades" ON grades
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

CREATE POLICY "Trainers and system can create grades" ON grades
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
    OR grader_type = 'ai'
  );

CREATE POLICY "Trainers can update grades" ON grades
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

-- ==========================================
-- VERIFY
-- ==========================================

-- Test as authenticated user
SELECT 'Testing assignments access...' as test;
SELECT COUNT(*) as can_see_assignments FROM assignments WHERE is_active = true;

SELECT 'Testing submissions access...' as test;
SELECT COUNT(*) as can_see_my_submissions FROM submissions WHERE student_id = auth.uid();

SELECT '✅ RLS policies updated! Try again in the app.' as result;

