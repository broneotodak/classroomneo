-- ==========================================
-- Add 'superseded' Status to Submissions
-- ==========================================

-- Allow submissions to be marked as 'superseded' when student resubmits

-- Drop the constraint
ALTER TABLE submissions 
DROP CONSTRAINT IF EXISTS submissions_status_check;

-- Add new constraint with 'superseded' status
ALTER TABLE submissions
ADD CONSTRAINT submissions_status_check 
CHECK (status IN ('pending', 'grading', 'graded', 'returned', 'superseded'));

-- Verify
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'submissions'::regclass
  AND conname LIKE '%status%';

SELECT '✅ Superseded status added! Students can now resubmit assignments.' as result;

