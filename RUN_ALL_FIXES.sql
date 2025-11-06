-- ==========================================
-- COMPLETE FIX: All Database Issues
-- ==========================================
-- Run this entire script to fix all current issues:
-- 1. "Unknown" student names
-- 2. "Pending" status on graded submissions
-- 3. Missing RLS policies

-- ==========================================
-- FIX 1: Create Missing User Profiles
-- ==========================================

INSERT INTO users_profile (id, role, github_username, github_avatar_url, created_at)
SELECT 
  id,
  'student' as role,
  COALESCE(
    raw_user_meta_data->>'user_name',
    raw_user_meta_data->>'full_name', 
    split_part(email, '@', 1)  -- Use email username as fallback
  ) as github_username,
  COALESCE(
    raw_user_meta_data->>'avatar_url',
    'https://ui-avatars.com/api/?name=' || COALESCE(
      raw_user_meta_data->>'user_name',
      split_part(email, '@', 1)
    )
  ) as github_avatar_url,
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM users_profile)
ON CONFLICT (id) DO NOTHING;

-- Update existing profiles with NULL or empty usernames
UPDATE users_profile up
SET 
  github_username = COALESCE(
    NULLIF(up.github_username, ''),
    au.raw_user_meta_data->>'user_name',
    au.raw_user_meta_data->>'full_name',
    split_part(au.email, '@', 1)
  ),
  github_avatar_url = COALESCE(
    NULLIF(up.github_avatar_url, ''),
    au.raw_user_meta_data->>'avatar_url',
    'https://ui-avatars.com/api/?name=' || COALESCE(
      au.raw_user_meta_data->>'user_name',
      split_part(au.email, '@', 1)
    )
  )
FROM auth.users au
WHERE up.id = au.id
  AND (up.github_username IS NULL OR up.github_username = '');

-- ==========================================
-- FIX 2: Update Graded Submissions Status
-- ==========================================

-- Fix submissions that have grades but show "pending"
UPDATE submissions
SET 
  status = 'graded',
  graded_at = COALESCE(graded_at, (
    SELECT g.created_at 
    FROM grades g 
    WHERE g.submission_id = submissions.id 
    LIMIT 1
  ))
WHERE id IN (
  SELECT DISTINCT s.id 
  FROM submissions s
  INNER JOIN grades g ON g.submission_id = s.id
  WHERE s.status != 'graded'
);

-- ==========================================
-- FIX 3: Ensure All RLS Policies
-- ==========================================

-- Assignments - Allow everyone to view
DROP POLICY IF EXISTS "Everyone can view active assignments" ON assignments;
CREATE POLICY "Everyone can view active assignments" ON assignments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Grades - Students view own
DROP POLICY IF EXISTS "Students view own grades" ON grades;
CREATE POLICY "Students view own grades" ON grades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE submissions.id = grades.submission_id
      AND submissions.student_id = auth.uid()
    )
  );

-- Grades - Trainers view all
DROP POLICY IF EXISTS "Trainers and admins view all grades" ON grades;
CREATE POLICY "Trainers and admins view all grades" ON grades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role IN ('trainer', 'admin')
    )
  );

-- Grades - Allow insert
DROP POLICY IF EXISTS "Trainers and system insert grades" ON grades;
CREATE POLICY "Trainers and system insert grades" ON grades
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role IN ('trainer', 'admin')
    )
    OR graded_by IS NULL
  );

-- ==========================================
-- VERIFICATION
-- ==========================================

-- 1. Check user profiles
SELECT 
  'User Profiles:' as check_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE github_username IS NOT NULL) as with_username,
  COUNT(*) FILTER (WHERE github_username IS NULL OR github_username = '') as missing_username
FROM users_profile;

-- 2. Check submissions status
SELECT 
  'Submissions Status:' as check_type,
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE id IN (SELECT submission_id FROM grades)) as has_grade
FROM submissions
GROUP BY status;

-- 3. Check graded submissions
SELECT 
  s.id,
  up.github_username as student,
  a.title as assignment,
  s.status,
  g.score,
  g.grader_type,
  s.submitted_at,
  s.graded_at
FROM submissions s
LEFT JOIN users_profile up ON up.id = s.student_id
LEFT JOIN assignments a ON a.id = s.assignment_id
LEFT JOIN grades g ON g.submission_id = s.id
ORDER BY s.submitted_at DESC
LIMIT 10;

SELECT '✅ ALL FIXES APPLIED SUCCESSFULLY!' as result;

