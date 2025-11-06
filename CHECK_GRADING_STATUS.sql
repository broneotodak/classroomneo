-- ==========================================
-- Check Grading Status and Debug Issues
-- ==========================================

-- 1. Check all submissions and their grading status
SELECT 
  s.id as submission_id,
  u.email as student_email,
  up.github_username,
  a.title as assignment,
  s.status as submission_status,
  s.submitted_at,
  s.graded_at,
  CASE 
    WHEN g.id IS NOT NULL THEN 'Has Grade'
    ELSE 'No Grade'
  END as grade_status,
  g.score,
  g.grader_type,
  g.created_at as graded_at
FROM submissions s
JOIN auth.users u ON s.student_id = u.id
LEFT JOIN users_profile up ON s.student_id = up.id
JOIN assignments a ON s.assignment_id = a.id
LEFT JOIN grades g ON g.submission_id = s.id
ORDER BY s.submitted_at DESC;

-- 2. Check for submissions with grades but still showing "pending"
SELECT 
  s.id,
  s.status as current_status,
  g.id as grade_id,
  g.score,
  'Status should be "graded" but is "' || s.status || '"' as issue
FROM submissions s
JOIN grades g ON g.submission_id = s.id
WHERE s.status != 'graded';

-- 3. Check recent grades created
SELECT 
  g.id,
  g.submission_id,
  g.score,
  g.grader_type,
  g.feedback,
  g.created_at,
  s.status as submission_status
FROM grades g
JOIN submissions s ON s.id = g.submission_id
ORDER BY g.created_at DESC
LIMIT 10;

-- 4. Fix any submissions that have grades but wrong status
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

SELECT 'Check complete! Fixed any mismatched statuses.' as result;

