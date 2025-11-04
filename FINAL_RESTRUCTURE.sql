-- ==========================================
-- FINAL DATABASE RESTRUCTURE
-- ==========================================
-- Proper hierarchy: Trainer → Class → Modules → Steps → Progress
-- Run this ENTIRE script in Supabase SQL Editor

-- ==========================================
-- STEP 1: Backup and Clean (Optional - comment out if you want to keep data)
-- ==========================================

-- If you want a fresh start, uncomment these:
-- DROP TABLE IF EXISTS user_progress CASCADE;
-- DROP TABLE IF EXISTS steps CASCADE;
-- DROP TABLE IF EXISTS modules CASCADE;
-- DROP TABLE IF EXISTS class_enrollments CASCADE;
-- DROP TABLE IF EXISTS classes CASCADE;
-- DROP TABLE IF EXISTS messages CASCADE;
-- Note: users_profile will remain

-- ==========================================
-- STEP 2: Create/Update Tables
-- ==========================================

-- Classes table (already exists, just ensure it's there)
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

-- Class enrollments (allow trainers to enroll too!)
CREATE TABLE IF NOT EXISTS class_enrollments (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  UNIQUE(class_id, student_id)
);

-- Modules table - NOW LINKED TO CLASSES!
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_number INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, slug)  -- Unique per class
);

-- Steps table (unchanged)
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

-- User progress table (unchanged)
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

-- Messages table (unchanged)
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 200),
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- STEP 3: Enable RLS
-- ==========================================

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 4: RLS Policies
-- ==========================================

-- Classes Policies
DROP POLICY IF EXISTS "Students can view active classes" ON classes;
DROP POLICY IF EXISTS "Admins and trainers can view all classes" ON classes;
DROP POLICY IF EXISTS "Trainers and admins can create classes" ON classes;
DROP POLICY IF EXISTS "Trainers can update their own classes" ON classes;

CREATE POLICY "Anyone can view active classes" ON classes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Trainers and admins can create classes" ON classes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role IN ('trainer', 'admin')
    )
  );

CREATE POLICY "Trainers can update their own classes" ON classes
  FOR UPDATE USING (
    trainer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Trainers can delete their own classes" ON classes
  FOR DELETE USING (
    trainer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Class Enrollments Policies
DROP POLICY IF EXISTS "Students can view their own enrollments" ON class_enrollments;
DROP POLICY IF EXISTS "Trainers can view enrollments in their classes" ON class_enrollments;
DROP POLICY IF EXISTS "Trainers and admins can enroll students" ON class_enrollments;
DROP POLICY IF EXISTS "Students can enroll themselves" ON class_enrollments;

CREATE POLICY "Users can view their own enrollments" ON class_enrollments
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Trainers can view enrollments in their classes" ON class_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_enrollments.class_id 
      AND trainer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- NEW: Anyone (including trainers/admins) can enroll themselves
CREATE POLICY "Users can enroll themselves in active classes" ON class_enrollments
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_enrollments.class_id 
      AND is_active = true
    )
  );

-- Trainers and admins can enroll others
CREATE POLICY "Trainers and admins can enroll students" ON class_enrollments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role IN ('trainer', 'admin')
    )
  );

-- Allow removing enrollments
CREATE POLICY "Trainers can remove enrollments from their classes" ON class_enrollments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_enrollments.class_id 
      AND trainer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Modules Policies - Can only view if enrolled in the class
DROP POLICY IF EXISTS "Anyone can view active modules" ON modules;
DROP POLICY IF EXISTS "Students can view modules in enrolled classes" ON modules;
DROP POLICY IF EXISTS "Admins and trainers can view all modules" ON modules;

CREATE POLICY "Users can view modules in their enrolled classes" ON modules
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM class_enrollments ce
      WHERE ce.class_id = modules.class_id 
      AND ce.student_id = auth.uid()
      AND ce.status = 'active'
    )
  );

CREATE POLICY "Admins and trainers can view all modules" ON modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Steps Policies
DROP POLICY IF EXISTS "Anyone can view steps" ON steps;

CREATE POLICY "Users can view steps in enrolled class modules" ON steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN class_enrollments ce ON ce.class_id = m.class_id
      WHERE m.id = steps.module_id
      AND ce.student_id = auth.uid()
      AND ce.status = 'active'
    )
  );

CREATE POLICY "Admins and trainers can view all steps" ON steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- User Progress Policies (unchanged)
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;

CREATE POLICY "Users can view their own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- STEP 5: Helper Function - Create Class with Modules
-- ==========================================

CREATE OR REPLACE FUNCTION create_class_with_default_modules(
  p_class_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_class_id INTEGER;
BEGIN
  -- Check if user is admin or trainer
  IF NOT EXISTS (
    SELECT 1 FROM users_profile 
    WHERE id = auth.uid() AND role IN ('admin', 'trainer')
  ) THEN
    RAISE EXCEPTION 'Only admins and trainers can create classes';
  END IF;

  -- Create the class
  INSERT INTO classes (name, description, trainer_id, start_date, end_date, is_active)
  VALUES (p_class_name, p_description, auth.uid(), p_start_date, p_end_date, true)
  RETURNING id INTO v_class_id;

  -- Create default modules for this class
  INSERT INTO modules (class_id, slug, title, description, order_number, is_active) VALUES
    (v_class_id, 'github-signup', 'GitHub Account Setup', 'Create your GitHub account - your gateway to modern development', 1, true),
    (v_class_id, 'cursor', 'Cursor AI Setup', 'Download and set up Cursor AI-powered code editor', 2, true),
    (v_class_id, 'supabase', 'Supabase Backend', 'Set up your backend with Supabase authentication and database', 3, true),
    (v_class_id, 'netlify', 'Netlify Deployment', 'Deploy your website with continuous deployment', 4, true);

  -- Create steps for Module 1: GitHub Signup
  INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes)
  SELECT m.id, slug, title, order_number, estimated_minutes
  FROM (VALUES
    ('why-github', 'Why GitHub Matters', 1, 3),
    ('create-account', 'Create Your GitHub Account', 2, 5),
    ('setup-profile', 'Set Up Your Profile', 3, 5),
    ('enable-2fa', 'Enable Two-Factor Authentication', 4, 7),
    ('explore-github', 'Explore GitHub Features', 5, 10)
  ) AS v(slug, title, order_number, estimated_minutes)
  CROSS JOIN modules m
  WHERE m.class_id = v_class_id AND m.slug = 'github-signup';

  -- Create steps for Module 2: Cursor
  INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes)
  SELECT m.id, slug, title, order_number, estimated_minutes
  FROM (VALUES
    ('download', 'Download Cursor', 1, 5),
    ('install', 'Install and Launch', 2, 10),
    ('signin', 'Sign In with GitHub', 3, 5),
    ('configure', 'Configure AI Features', 4, 15),
    ('first-project', 'Create Your First Project', 5, 20)
  ) AS v(slug, title, order_number, estimated_minutes)
  CROSS JOIN modules m
  WHERE m.class_id = v_class_id AND m.slug = 'cursor';

  -- Create steps for Module 3: Supabase
  INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes)
  SELECT m.id, slug, title, order_number, estimated_minutes
  FROM (VALUES
    ('account', 'Create Supabase Account with GitHub', 1, 5),
    ('project', 'Create New Project', 2, 10),
    ('github-auth', 'Enable GitHub Authentication', 3, 10),
    ('table', 'Create Your First Table', 4, 15),
    ('credentials', 'Get API Credentials', 5, 5),
    ('initialize', 'Initialize Supabase Client', 6, 10),
    ('query', 'Query Your Database', 7, 20)
  ) AS v(slug, title, order_number, estimated_minutes)
  CROSS JOIN modules m
  WHERE m.class_id = v_class_id AND m.slug = 'supabase';

  -- Create steps for Module 4: Netlify
  INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes)
  SELECT m.id, slug, title, order_number, estimated_minutes
  FROM (VALUES
    ('signup', 'Sign Up for Netlify with GitHub', 1, 5),
    ('connect-repo', 'Connect Your GitHub Repository', 2, 10),
    ('configure-build', 'Configure Build Settings', 3, 10),
    ('deploy', 'Deploy Your Site', 4, 10),
    ('custom-domain', 'Custom Domain (Optional)', 5, 15)
  ) AS v(slug, title, order_number, estimated_minutes)
  CROSS JOIN modules m
  WHERE m.class_id = v_class_id AND m.slug = 'netlify';

  -- Auto-enroll the trainer in their own class
  INSERT INTO class_enrollments (class_id, student_id, status)
  VALUES (v_class_id, auth.uid(), 'active')
  ON CONFLICT (class_id, student_id) DO NOTHING;

  RETURN v_class_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_class_with_default_modules TO authenticated;

-- ==========================================
-- STEP 6: Update Existing Data
-- ==========================================

-- If you have existing modules without class_id, we need to handle them
-- Option A: Delete old template modules
DELETE FROM modules WHERE class_id IS NULL;

-- Option B: Or link them to your existing class (if you have one)
-- UPDATE modules SET class_id = 1 WHERE class_id IS NULL;

-- ==========================================
-- STEP 7: Recreate Modules for Existing Classes
-- ==========================================

-- For each existing class, create modules
-- Get your class ID first:
SELECT id, name FROM classes ORDER BY id;

-- Then run this for EACH class (replace <CLASS_ID> with actual ID):
-- Example for class_id = 1:
DO $$
DECLARE
  v_class_id INTEGER;
BEGIN
  -- Get the first class (adjust this as needed)
  SELECT id INTO v_class_id FROM classes ORDER BY id LIMIT 1;
  
  IF v_class_id IS NOT NULL THEN
    -- Delete old modules for this class if any
    DELETE FROM modules WHERE class_id = v_class_id;
    
    -- Create modules for this class
    INSERT INTO modules (class_id, slug, title, description, order_number, is_active) VALUES
      (v_class_id, 'github-signup', 'GitHub Account Setup', 'Create your GitHub account - your gateway to modern development', 1, true),
      (v_class_id, 'cursor', 'Cursor AI Setup', 'Download and set up Cursor AI-powered code editor', 2, true),
      (v_class_id, 'supabase', 'Supabase Backend', 'Set up your backend with Supabase authentication and database', 3, true),
      (v_class_id, 'netlify', 'Netlify Deployment', 'Deploy your website with continuous deployment', 4, true);

    -- Create steps for each module
    -- Module 1: GitHub
    INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes)
    SELECT m.id, v.slug, v.title, v.order_number, v.estimated_minutes
    FROM (VALUES
      ('why-github', 'Why GitHub Matters', 1, 3),
      ('create-account', 'Create Your GitHub Account', 2, 5),
      ('setup-profile', 'Set Up Your Profile', 3, 5),
      ('enable-2fa', 'Enable Two-Factor Authentication', 4, 7),
      ('explore-github', 'Explore GitHub Features', 5, 10)
    ) AS v(slug, title, order_number, estimated_minutes)
    CROSS JOIN modules m
    WHERE m.class_id = v_class_id AND m.slug = 'github-signup';

    -- Module 2: Cursor
    INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes)
    SELECT m.id, v.slug, v.title, v.order_number, v.estimated_minutes
    FROM (VALUES
      ('download', 'Download Cursor', 1, 5),
      ('install', 'Install and Launch', 2, 10),
      ('signin', 'Sign In with GitHub', 3, 5),
      ('configure', 'Configure AI Features', 4, 15),
      ('first-project', 'Create Your First Project', 5, 20)
    ) AS v(slug, title, order_number, estimated_minutes)
    CROSS JOIN modules m
    WHERE m.class_id = v_class_id AND m.slug = 'cursor';

    -- Module 3: Supabase
    INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes)
    SELECT m.id, v.slug, v.title, v.order_number, v.estimated_minutes
    FROM (VALUES
      ('account', 'Create Supabase Account with GitHub', 1, 5),
      ('project', 'Create New Project', 2, 10),
      ('github-auth', 'Enable GitHub Authentication', 3, 10),
      ('table', 'Create Your First Table', 4, 15),
      ('credentials', 'Get API Credentials', 5, 5),
      ('initialize', 'Initialize Supabase Client', 6, 10),
      ('query', 'Query Your Database', 7, 20)
    ) AS v(slug, title, order_number, estimated_minutes)
    CROSS JOIN modules m
    WHERE m.class_id = v_class_id AND m.slug = 'supabase';

    -- Module 4: Netlify
    INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes)
    SELECT m.id, v.slug, v.title, v.order_number, v.estimated_minutes
    FROM (VALUES
      ('signup', 'Sign Up for Netlify with GitHub', 1, 5),
      ('connect-repo', 'Connect Your GitHub Repository', 2, 10),
      ('configure-build', 'Configure Build Settings', 3, 10),
      ('deploy', 'Deploy Your Site', 4, 10),
      ('custom-domain', 'Custom Domain (Optional)', 5, 15)
    ) AS v(slug, title, order_number, estimated_minutes)
    CROSS JOIN modules m
    WHERE m.class_id = v_class_id AND m.slug = 'netlify';

    RAISE NOTICE 'Modules and steps created for class %', v_class_id;
  END IF;
END $$;

-- ==========================================
-- STEP 8: Update Policies for Modules
-- ==========================================

DROP POLICY IF EXISTS "Users can view modules in their enrolled classes" ON modules;
DROP POLICY IF EXISTS "Admins and trainers can view all modules" ON modules;

CREATE POLICY "Users can view modules in their enrolled classes" ON modules
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM class_enrollments ce
      WHERE ce.class_id = modules.class_id 
      AND ce.student_id = auth.uid()
      AND ce.status = 'active'
    )
  );

CREATE POLICY "Admins and trainers can view all modules" ON modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Steps policies
DROP POLICY IF EXISTS "Users can view steps in enrolled class modules" ON steps;
DROP POLICY IF EXISTS "Admins and trainers can view all steps" ON steps;

CREATE POLICY "Users can view steps in enrolled class modules" ON steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN class_enrollments ce ON ce.class_id = m.class_id
      WHERE m.id = steps.module_id
      AND ce.student_id = auth.uid()
      AND ce.status = 'active'
    )
  );

CREATE POLICY "Admins and trainers can view all steps" ON steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- ==========================================
-- DONE! Verify Everything
-- ==========================================

-- Check your classes
SELECT id, name, trainer_id, is_active FROM classes;

-- Check modules per class
SELECT 
  c.name as class_name,
  m.title as module_title,
  m.order_number,
  COUNT(s.id) as step_count
FROM classes c
LEFT JOIN modules m ON m.class_id = c.id
LEFT JOIN steps s ON s.module_id = m.id
GROUP BY c.id, c.name, m.id, m.title, m.order_number
ORDER BY c.id, m.order_number;

-- Check enrollments
SELECT 
  c.name as class_name,
  u.github_username,
  u.role,
  ce.status
FROM class_enrollments ce
JOIN classes c ON c.id = ce.class_id
JOIN users_profile u ON u.id = ce.student_id
ORDER BY c.id, u.github_username;

SELECT 'Database restructure complete! ✅' as status;

