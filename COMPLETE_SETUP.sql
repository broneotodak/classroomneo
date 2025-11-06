-- ==========================================
-- AI CLASSROOM - COMPLETE DATABASE SETUP
-- ==========================================
-- Run this ONCE in a fresh Supabase project
-- Or run on existing project (it's idempotent - safe to re-run)

-- This script includes EVERYTHING needed:
-- 1. User profiles with roles
-- 2. Classes and enrollments
-- 3. Modules and steps (class-specific)
-- 4. Progress tracking
-- 5. Assignments and AI grading
-- 6. Certificates
-- 7. Community messages
-- 8. All RLS policies
-- 9. Helper functions

-- ==========================================
-- TABLES
-- ==========================================

-- 1. User Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_username TEXT,
  github_avatar_url TEXT,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'trainer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Classes
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Class Enrollments
CREATE TABLE IF NOT EXISTS class_enrollments (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  UNIQUE(class_id, student_id)
);

-- 4. Modules (class-specific!)
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_number INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, slug)
);

-- 5. Steps
CREATE TABLE IF NOT EXISTS steps (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  order_number INTEGER NOT NULL,
  estimated_minutes INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(module_id, slug)
);

-- 6. User Progress
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  step_id INTEGER REFERENCES steps(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, step_id)
);

-- 7. Assignments
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
  ai_grading_rubric TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_type TEXT CHECK (submission_type IN ('file', 'url', 'both')),
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  submission_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'grading', 'graded', 'returned')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- 9. Grades
CREATE TABLE IF NOT EXISTS grades (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
  grader_type TEXT CHECK (grader_type IN ('ai', 'manual', 'hybrid')),
  score INTEGER CHECK (score >= 1 AND score <= 5),
  feedback TEXT,
  ai_analysis TEXT,
  ai_strengths TEXT,
  ai_improvements TEXT,
  graded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id)
);

-- 10. Certificates (NEW!)
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  completion_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  modules_completed INTEGER NOT NULL,
  total_modules INTEGER NOT NULL,
  assignments_graded INTEGER NOT NULL,
  total_assignments INTEGER NOT NULL,
  average_grade NUMERIC(3,2),
  certificate_code TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id)
);

-- 11. Messages (community board)
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 200),
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ENABLE RLS ON ALL TABLES
-- ==========================================

ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- Users Profile
CREATE POLICY IF NOT EXISTS "Users view own profile" ON users_profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Trainers view all profiles" ON users_profile FOR SELECT USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('trainer', 'admin')));
CREATE POLICY IF NOT EXISTS "Users update own profile" ON users_profile FOR UPDATE USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users insert own profile" ON users_profile FOR INSERT WITH CHECK (auth.uid() = id);

-- Classes
CREATE POLICY IF NOT EXISTS "Anyone view active classes" ON classes FOR SELECT USING (is_active = true);
CREATE POLICY IF NOT EXISTS "Trainers create classes" ON classes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('trainer', 'admin')));
CREATE POLICY IF NOT EXISTS "Trainers update classes" ON classes FOR UPDATE USING (trainer_id = auth.uid() OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "Trainers delete classes" ON classes FOR DELETE USING (trainer_id = auth.uid() OR EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'));

-- Class Enrollments
CREATE POLICY IF NOT EXISTS "Users view own enrollments" ON class_enrollments FOR SELECT USING (student_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Trainers view all enrollments" ON class_enrollments FOR SELECT USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('trainer', 'admin')));
CREATE POLICY IF NOT EXISTS "Users enroll themselves" ON class_enrollments FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Trainers enroll students" ON class_enrollments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('trainer', 'admin')));
CREATE POLICY IF NOT EXISTS "Trainers remove enrollments" ON class_enrollments FOR DELETE USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('trainer', 'admin')));

-- Modules
CREATE POLICY IF NOT EXISTS "Enrolled users view modules" ON modules FOR SELECT USING (EXISTS (SELECT 1 FROM class_enrollments WHERE class_id = modules.class_id AND student_id = auth.uid() AND status = 'active'));
CREATE POLICY IF NOT EXISTS "Trainers view all modules" ON modules FOR SELECT USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('trainer', 'admin')));

-- Steps
CREATE POLICY IF NOT EXISTS "Enrolled users view steps" ON steps FOR SELECT USING (EXISTS (SELECT 1 FROM modules m JOIN class_enrollments ce ON ce.class_id = m.class_id WHERE m.id = steps.module_id AND ce.student_id = auth.uid() AND ce.status = 'active'));
CREATE POLICY IF NOT EXISTS "Trainers view all steps" ON steps FOR SELECT USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('trainer', 'admin')));

-- User Progress
CREATE POLICY IF NOT EXISTS "Users view own progress" ON user_progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users insert own progress" ON user_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users update own progress" ON user_progress FOR UPDATE USING (user_id = auth.uid());

-- Assignments
CREATE POLICY IF NOT EXISTS "Authenticated view assignments" ON assignments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Trainers manage assignments" ON assignments FOR ALL USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('trainer', 'admin')));

-- Submissions
CREATE POLICY IF NOT EXISTS "Users view own submissions" ON submissions FOR SELECT USING (student_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Trainers view all submissions" ON submissions FOR SELECT USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('trainer', 'admin')));
CREATE POLICY IF NOT EXISTS "Users create submissions" ON submissions FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users update pending submissions" ON submissions FOR UPDATE USING (student_id = auth.uid() AND status = 'pending');
CREATE POLICY IF NOT EXISTS "Trainers update submissions" ON submissions FOR UPDATE USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('trainer', 'admin')));

-- Grades
CREATE POLICY IF NOT EXISTS "Users view own grades" ON grades FOR SELECT USING (EXISTS (SELECT 1 FROM submissions WHERE id = grades.submission_id AND student_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Trainers view all grades" ON grades FOR SELECT USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('trainer', 'admin')));
CREATE POLICY IF NOT EXISTS "Trainers create grades" ON grades FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('trainer', 'admin')));
CREATE POLICY IF NOT EXISTS "Trainers update grades" ON grades FOR UPDATE USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('trainer', 'admin')));

-- Certificates
CREATE POLICY IF NOT EXISTS "Users view own certificates" ON certificates FOR SELECT USING (student_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Trainers view all certificates" ON certificates FOR SELECT USING (EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role IN ('trainer', 'admin')));
CREATE POLICY IF NOT EXISTS "System create certificates" ON certificates FOR INSERT WITH CHECK (true);

-- Messages
CREATE POLICY IF NOT EXISTS "Anyone view messages" ON messages FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated post messages" ON messages FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users delete own messages" ON messages FOR DELETE USING (user_id = auth.uid());

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON user_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_steps_module_id ON steps(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_class_id ON modules(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_step_id ON assignments(step_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_submission_id ON grades(submission_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, full_name, github_username, github_avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_profile_updated_at ON users_profile;
CREATE TRIGGER update_users_profile_updated_at
  BEFORE UPDATE ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function: Get student roster (for admin dashboard)
CREATE OR REPLACE FUNCTION get_student_roster()
RETURNS TABLE (
  id UUID,
  github_username TEXT,
  github_avatar_url TEXT,
  email TEXT,
  full_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  class_id INTEGER,
  class_name TEXT,
  total_steps_started BIGINT,
  steps_completed BIGINT,
  overall_completion_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users_profile 
    WHERE users_profile.id = auth.uid() 
    AND users_profile.role IN ('admin', 'trainer')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin or trainer role required.';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.github_username,
    u.github_avatar_url,
    u.email,
    u.full_name,
    u.role,
    u.created_at,
    u.last_login,
    ce.class_id,
    c.name as class_name,
    COUNT(DISTINCT up.id) as total_steps_started,
    COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.id END) as steps_completed,
    ROUND(
      (COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.id END)::NUMERIC / 
       NULLIF(COUNT(DISTINCT up.id), 0)) * 100,
      2
    ) as overall_completion_percentage
  FROM users_profile u
  LEFT JOIN class_enrollments ce ON ce.student_id = u.id AND ce.status = 'active'
  LEFT JOIN classes c ON c.id = ce.class_id
  LEFT JOIN user_progress up ON up.user_id = u.id
  WHERE u.role = 'student'
  GROUP BY u.id, u.github_username, u.github_avatar_url, u.email, u.full_name, u.role, u.created_at, u.last_login, ce.class_id, c.name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_student_roster() TO authenticated;

-- Function: Check certificate eligibility
CREATE OR REPLACE FUNCTION check_certificate_eligibility(p_student_id UUID, p_class_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_modules INTEGER;
  v_completed_modules INTEGER;
  v_total_assignments INTEGER;
  v_graded_assignments INTEGER;
  v_avg_grade NUMERIC;
BEGIN
  -- Count modules in class
  SELECT COUNT(*) INTO v_total_modules
  FROM modules WHERE class_id = p_class_id AND is_active = true;

  -- Count completed modules by student
  SELECT COUNT(DISTINCT m.id) INTO v_completed_modules
  FROM modules m
  JOIN steps s ON s.module_id = m.id
  JOIN user_progress up ON up.step_id = s.id
  WHERE m.class_id = p_class_id 
  AND up.user_id = p_student_id
  AND up.status = 'completed'
  GROUP BY m.id
  HAVING COUNT(*) = (SELECT COUNT(*) FROM steps WHERE module_id = m.id);

  -- Count assignments in class
  SELECT COUNT(DISTINCT a.id) INTO v_total_assignments
  FROM assignments a
  JOIN steps s ON s.id = a.step_id
  JOIN modules m ON m.id = s.module_id
  WHERE m.class_id = p_class_id AND a.is_active = true;

  -- Count graded assignments
  SELECT COUNT(*), AVG(g.score) INTO v_graded_assignments, v_avg_grade
  FROM submissions sub
  JOIN assignments a ON a.id = sub.assignment_id
  JOIN steps s ON s.id = a.step_id
  JOIN modules m ON m.id = s.module_id
  JOIN grades g ON g.submission_id = sub.id
  WHERE m.class_id = p_class_id 
  AND sub.student_id = p_student_id;

  -- Eligible if: all modules complete, all assignments graded, avg >= 3.0
  RETURN (v_completed_modules >= v_total_modules 
    AND v_graded_assignments >= v_total_assignments 
    AND v_total_assignments > 0
    AND v_avg_grade >= 3.0);
END;
$$;

GRANT EXECUTE ON FUNCTION check_certificate_eligibility TO authenticated;

-- ==========================================
-- INITIAL DATA (Optional - comment out if not needed)
-- ==========================================

-- Set first user as admin (replace with your GitHub username)
-- UPDATE users_profile SET role = 'admin' WHERE github_username = 'broneotodak';

SELECT '✅ Complete setup finished! All tables, policies, and functions created.' as result;

