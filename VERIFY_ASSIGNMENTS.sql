-- ==========================================
-- VERIFY ASSIGNMENTS SETUP
-- ==========================================

-- Step 1: Check if tables exist
SELECT 
  'assignments' as table_name,
  COUNT(*) as row_count
FROM assignments
UNION ALL
SELECT 
  'submissions' as table_name,
  COUNT(*) as row_count
FROM submissions
UNION ALL
SELECT 
  'grades' as table_name,
  COUNT(*) as row_count
FROM grades;

-- Step 2: Check all assignments (simple query)
SELECT * FROM assignments;

-- Step 3: If no assignments, let's check your steps
SELECT 
  s.id as step_id,
  s.slug,
  s.title,
  m.slug as module_slug,
  m.title as module_title
FROM steps s
JOIN modules m ON m.id = s.module_id
WHERE m.slug = 'netlify';

-- Step 4: Create assignment manually with a specific step_id
-- First, find your netlify deploy step ID from Step 3 above, then run:

-- Example (replace X with actual step_id from above):
/*
INSERT INTO assignments (
  step_id, 
  title, 
  description,
  instructions, 
  max_score, 
  ai_grading_enabled, 
  ai_grading_rubric,
  allow_file_upload,
  allow_url_submission
) VALUES (
  X,  -- Replace with actual step_id
  'Deploy Your First Website',
  'Deploy a simple website using Netlify',
  'Create a basic HTML website with: 1) A homepage, 2) Professional styling, 3) Responsive design. Deploy to Netlify and submit the URL.',
  5,
  true,
  'Grade on: 1) Live and accessible, 2) Clean HTML, 3) Professional CSS, 4) Responsive design, 5) Quality and creativity. Be encouraging!',
  true,
  true
);
*/

-- Step 5: Verify assignment was created
SELECT COUNT(*) as total_assignments FROM assignments;

