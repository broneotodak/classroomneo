-- ==========================================
-- CHECK: Verify Modules Were Created
-- ==========================================

-- Step 1: Check your classes
SELECT id, name, trainer_id, is_active FROM classes ORDER BY id;

-- Step 2: Check if modules exist for your class
SELECT 
  c.id as class_id,
  c.name as class_name,
  m.id as module_id,
  m.title as module_title,
  m.class_id,
  COUNT(s.id) as step_count
FROM classes c
LEFT JOIN modules m ON m.class_id = c.id
LEFT JOIN steps s ON s.module_id = m.id
GROUP BY c.id, c.name, m.id, m.title, m.class_id
ORDER BY c.id, m.order_number;

-- Step 3: If no modules, let's create them manually for your class
-- First, get your class ID (replace X with the actual id from Step 1)
DO $$
DECLARE
  v_class_id INTEGER;
  v_github_module_id INTEGER;
  v_cursor_module_id INTEGER;
  v_supabase_module_id INTEGER;
  v_netlify_module_id INTEGER;
BEGIN
  -- Get your class ID (adjust if you have multiple classes)
  SELECT id INTO v_class_id FROM classes ORDER BY created_at DESC LIMIT 1;
  
  RAISE NOTICE 'Creating modules for class_id: %', v_class_id;
  
  -- Delete existing modules for this class (if any)
  DELETE FROM modules WHERE class_id = v_class_id;
  
  -- Create Module 1: GitHub
  INSERT INTO modules (class_id, slug, title, description, order_number, is_active)
  VALUES (v_class_id, 'github-signup', 'GitHub Account Setup', 'Create your GitHub account - your gateway to modern development', 1, true)
  RETURNING id INTO v_github_module_id;
  
  INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes) VALUES
    (v_github_module_id, 'why-github', 'Why GitHub Matters', 1, 3),
    (v_github_module_id, 'create-account', 'Create Your GitHub Account', 2, 5),
    (v_github_module_id, 'setup-profile', 'Set Up Your Profile', 3, 5),
    (v_github_module_id, 'enable-2fa', 'Enable Two-Factor Authentication', 4, 7),
    (v_github_module_id, 'explore-github', 'Explore GitHub Features', 5, 10);
  
  -- Create Module 2: Cursor
  INSERT INTO modules (class_id, slug, title, description, order_number, is_active)
  VALUES (v_class_id, 'cursor', 'Cursor AI Setup', 'Download and set up Cursor AI-powered code editor', 2, true)
  RETURNING id INTO v_cursor_module_id;
  
  INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes) VALUES
    (v_cursor_module_id, 'download', 'Download Cursor', 1, 5),
    (v_cursor_module_id, 'install', 'Install and Launch', 2, 10),
    (v_cursor_module_id, 'signin', 'Sign In with GitHub', 3, 5),
    (v_cursor_module_id, 'configure', 'Configure AI Features', 4, 15),
    (v_cursor_module_id, 'first-project', 'Create Your First Project', 5, 20);
  
  -- Create Module 3: Supabase
  INSERT INTO modules (class_id, slug, title, description, order_number, is_active)
  VALUES (v_class_id, 'supabase', 'Supabase Backend', 'Set up your backend with Supabase authentication and database', 3, true)
  RETURNING id INTO v_supabase_module_id;
  
  INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes) VALUES
    (v_supabase_module_id, 'account', 'Create Supabase Account with GitHub', 1, 5),
    (v_supabase_module_id, 'project', 'Create New Project', 2, 10),
    (v_supabase_module_id, 'github-auth', 'Enable GitHub Authentication', 3, 10),
    (v_supabase_module_id, 'table', 'Create Your First Table', 4, 15),
    (v_supabase_module_id, 'credentials', 'Get API Credentials', 5, 5),
    (v_supabase_module_id, 'initialize', 'Initialize Supabase Client', 6, 10),
    (v_supabase_module_id, 'query', 'Query Your Database', 7, 20);
  
  -- Create Module 4: Netlify
  INSERT INTO modules (class_id, slug, title, description, order_number, is_active)
  VALUES (v_class_id, 'netlify', 'Netlify Deployment', 'Deploy your website with continuous deployment', 4, true)
  RETURNING id INTO v_netlify_module_id;
  
  INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes) VALUES
    (v_netlify_module_id, 'signup', 'Sign Up for Netlify with GitHub', 1, 5),
    (v_netlify_module_id, 'connect-repo', 'Connect Your GitHub Repository', 2, 10),
    (v_netlify_module_id, 'configure-build', 'Configure Build Settings', 3, 10),
    (v_netlify_module_id, 'deploy', 'Deploy Your Site', 4, 10),
    (v_netlify_module_id, 'custom-domain', 'Custom Domain (Optional)', 5, 15);
  
  RAISE NOTICE 'Created 4 modules with 22 total steps for class_id: %', v_class_id;
END $$;

-- Step 4: Verify modules were created
SELECT 
  c.name as class_name,
  m.title as module_title,
  m.order_number,
  COUNT(s.id) as steps
FROM classes c
JOIN modules m ON m.class_id = c.id
LEFT JOIN steps s ON s.module_id = m.id
GROUP BY c.id, c.name, m.id, m.title, m.order_number
ORDER BY c.id, m.order_number;

-- Step 5: Check enrollments
SELECT 
  c.name as class_name,
  u.github_username,
  u.role,
  ce.status
FROM class_enrollments ce
JOIN classes c ON c.id = ce.class_id
JOIN users_profile u ON u.id = ce.student_id
ORDER BY c.name, u.github_username;

SELECT '✅ Modules created! Users can now see them after refresh.' as result;

