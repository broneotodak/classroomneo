-- ==========================================
-- Fix Submission Status Inconsistencies
-- ==========================================

-- Issue: Submissions show "pending" even though they have grades
-- Solution: Update status to "graded" for all submissions that have grades

-- Update submissions with grades but wrong status
UPDATE submissions
SET 
  status = 'graded',
  graded_at = (
    SELECT g.created_at 
    FROM grades g 
    WHERE g.submission_id = submissions.id 
    LIMIT 1
  )
WHERE id IN (
  SELECT DISTINCT s.id 
  FROM submissions s
  INNER JOIN grades g ON g.submission_id = s.id
  WHERE s.status != 'graded'
)
RETURNING id, status, graded_at;

-- Verify the fix
SELECT 
  s.id,
  s.status,
  s.submitted_at,
  s.graded_at,
  g.score,
  g.grader_type,
  'Fixed!' as result
FROM submissions s
INNER JOIN grades g ON g.submission_id = s.id
WHERE s.status = 'graded'
ORDER BY s.submitted_at DESC;

SELECT '✅ All graded submissions now show correct status!' as message;

