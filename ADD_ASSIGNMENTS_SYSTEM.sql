-- ==========================================
-- AI CLASSROOM - Assignments & AI Grading System
-- ==========================================

-- Step 1: Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  step_id INTEGER REFERENCES steps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  max_score INTEGER DEFAULT 5 CHECK (max_score >= 1 AND max_score <= 5),
  allow_file_upload BOOLEAN DEFAULT true,
  allow_url_submission BOOLEAN DEFAULT true,
  allowed_file_types TEXT[] DEFAULT ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
  max_file_size_mb INTEGER DEFAULT 10,
  due_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  ai_grading_enabled BOOLEAN DEFAULT true,
  ai_grading_rubric TEXT,  -- Custom rubric for AI to follow
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_type TEXT CHECK (submission_type IN ('file', 'url', 'both')),
  file_url TEXT,  -- Supabase Storage URL
  file_name TEXT,
  file_type TEXT,
  submission_url TEXT,  -- Student's submitted URL (e.g., deployed project, GitHub repo)
  notes TEXT,  -- Student's notes/comments
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'grading', 'graded', 'returned')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- Step 3: Create grades table
CREATE TABLE IF NOT EXISTS grades (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
  grader_type TEXT CHECK (grader_type IN ('ai', 'manual', 'hybrid')),
  score INTEGER CHECK (score >= 1 AND score <= 5),
  feedback TEXT,
  ai_analysis TEXT,  -- Detailed AI analysis
  ai_strengths TEXT,  -- What AI thinks student did well
  ai_improvements TEXT,  -- What AI suggests to improve
  graded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- Trainer who reviewed (if manual)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id)
);

-- Step 4: Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies for Assignments

-- Students can view assignments in their enrolled class modules
CREATE POLICY "Students can view assignments in enrolled classes" ON assignments
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM steps s
      JOIN modules m ON m.id = s.module_id
      JOIN class_enrollments ce ON ce.class_id = m.class_id
      WHERE s.id = assignments.step_id
      AND ce.student_id = auth.uid()
      AND ce.status = 'active'
    )
  );

-- Trainers and admins can view all assignments
CREATE POLICY "Trainers and admins can view all assignments" ON assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Trainers and admins can create assignments
CREATE POLICY "Trainers and admins can create assignments" ON assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Trainers and admins can update assignments
CREATE POLICY "Trainers and admins can update assignments" ON assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Step 6: RLS Policies for Submissions

-- Students can view their own submissions
CREATE POLICY "Students can view their own submissions" ON submissions
  FOR SELECT USING (student_id = auth.uid());

-- Trainers can view submissions for assignments in their classes
CREATE POLICY "Trainers can view submissions in their classes" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN steps s ON s.id = a.step_id
      JOIN modules m ON m.id = s.module_id
      JOIN classes c ON c.id = m.class_id
      WHERE a.id = submissions.assignment_id
      AND c.trainer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students can create their own submissions
CREATE POLICY "Students can submit assignments" ON submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students can update their own pending submissions
CREATE POLICY "Students can update own pending submissions" ON submissions
  FOR UPDATE USING (
    student_id = auth.uid() AND 
    status = 'pending'
  );

-- Trainers can update submission status
CREATE POLICY "Trainers can update submission status" ON submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN steps s ON s.id = a.step_id
      JOIN modules m ON m.id = s.module_id
      JOIN classes c ON c.id = m.class_id
      WHERE a.id = submissions.assignment_id
      AND c.trainer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 7: RLS Policies for Grades

-- Students can view their own grades
CREATE POLICY "Students can view their own grades" ON grades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.id = grades.submission_id
      AND s.student_id = auth.uid()
    )
  );

-- Trainers can view grades in their classes
CREATE POLICY "Trainers can view grades in their classes" ON grades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM submissions sub
      JOIN assignments a ON a.id = sub.assignment_id
      JOIN steps s ON s.id = a.step_id
      JOIN modules m ON m.id = s.module_id
      JOIN classes c ON c.id = m.class_id
      WHERE sub.id = grades.submission_id
      AND c.trainer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trainers and AI system can create grades
CREATE POLICY "Trainers and system can create grades" ON grades
  FOR INSERT WITH CHECK (
    graded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_step_id ON assignments(step_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_grades_submission_id ON grades(submission_id);

-- Step 9: Create storage bucket for submissions
-- Note: This needs to be run separately or via Supabase Dashboard → Storage
-- Create bucket named: 'assignment-submissions'
-- Policies will be set via UI or separate commands

-- Step 10: Helper view for trainers to see all submissions
CREATE OR REPLACE VIEW trainer_submissions_view AS
SELECT 
  s.id as submission_id,
  a.title as assignment_title,
  st.title as step_title,
  m.title as module_title,
  c.name as class_name,
  c.trainer_id,
  u.github_username as student_username,
  u.github_avatar_url as student_avatar,
  s.submission_type,
  s.file_url,
  s.submission_url,
  s.notes,
  s.status,
  s.submitted_at,
  g.score,
  g.feedback,
  g.grader_type,
  g.graded_at
FROM submissions s
JOIN assignments a ON a.id = s.assignment_id
JOIN steps st ON st.id = a.step_id
JOIN modules m ON m.id = st.module_id
JOIN classes c ON c.id = m.class_id
JOIN users_profile u ON u.id = s.student_id
LEFT JOIN grades g ON g.submission_id = s.id;

GRANT SELECT ON trainer_submissions_view TO authenticated;

-- Step 11: Function to trigger AI grading
CREATE OR REPLACE FUNCTION request_ai_grading(p_submission_id INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment assignments%ROWTYPE;
  v_submission submissions%ROWTYPE;
BEGIN
  -- Get submission
  SELECT * INTO v_submission FROM submissions WHERE id = p_submission_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;
  
  -- Get assignment
  SELECT * INTO v_assignment FROM assignments WHERE id = v_submission.assignment_id;
  
  -- Update status to grading
  UPDATE submissions 
  SET status = 'grading' 
  WHERE id = p_submission_id;
  
  -- Return message for frontend to handle OpenAI call
  RETURN json_build_object(
    'assignment_id', v_assignment.id,
    'assignment_title', v_assignment.title,
    'instructions', v_assignment.instructions,
    'rubric', v_assignment.ai_grading_rubric,
    'submission_url', v_submission.submission_url,
    'file_url', v_submission.file_url,
    'student_notes', v_submission.notes
  )::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION request_ai_grading TO authenticated;

-- Step 12: Verification
SELECT 
  'Assignments system created! ✅' as status,
  (SELECT COUNT(*) FROM assignments) as total_assignments,
  (SELECT COUNT(*) FROM submissions) as total_submissions,
  (SELECT COUNT(*) FROM grades) as total_grades;

-- Step 13: Sample assignment (optional - for testing)
/*
INSERT INTO assignments (step_id, title, description, instructions, max_score, ai_grading_rubric)
SELECT 
  s.id,
  'Deploy Your First Website',
  'Deploy a simple website using Netlify',
  'Create a basic HTML/CSS website and deploy it to Netlify. Submit the live URL.',
  5,
  'Grade based on: 1) Website is live and accessible 2) Clean code structure 3) Responsive design 4) Professional appearance 5) Creativity'
FROM steps s
JOIN modules m ON m.id = s.module_id
WHERE m.slug = 'netlify' AND s.slug = 'deploy'
LIMIT 1;
*/

COMMENT ON TABLE assignments IS 'Assignments attached to specific steps that require student submissions';
COMMENT ON TABLE submissions IS 'Student submissions with files, URLs, and grading status';
COMMENT ON TABLE grades IS 'Grades from AI or manual review with detailed feedback';

