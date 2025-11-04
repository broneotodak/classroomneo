-- ==========================================
-- AI Classroom - Supabase Database Schema
-- ==========================================
-- Run this SQL in your Supabase SQL Editor

-- 1. Create users_profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_username TEXT,
  github_avatar_url TEXT,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_number INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create steps table
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

-- 4. Create user_progress table
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

-- 5. Create messages table (for demo section)
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 200),
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Insert default modules (NEW ORDER: GitHub → Cursor → Supabase → Netlify)
INSERT INTO modules (slug, title, description, order_number) VALUES
  ('github-signup', 'GitHub Account Setup', 'Create your GitHub account - your gateway to modern development', 1),
  ('cursor', 'Cursor AI Setup', 'Download and set up Cursor AI-powered code editor', 2),
  ('supabase', 'Supabase Backend', 'Set up your backend with Supabase authentication and database', 3),
  ('netlify', 'Netlify Deployment', 'Deploy your website with continuous deployment', 4)
ON CONFLICT (slug) DO NOTHING;

-- 7. Insert steps for GitHub Signup module (Module 1)
INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes) VALUES
  (1, 'why-github', 'Why GitHub Matters', 1, 3),
  (1, 'create-account', 'Create Your GitHub Account', 2, 5),
  (1, 'setup-profile', 'Set Up Your Profile', 3, 5),
  (1, 'enable-2fa', 'Enable Two-Factor Authentication', 4, 7),
  (1, 'explore-github', 'Explore GitHub Features', 5, 10)
ON CONFLICT (module_id, slug) DO NOTHING;

-- 8. Insert steps for Cursor module (Module 2)
INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes) VALUES
  (2, 'download', 'Download Cursor', 1, 5),
  (2, 'install', 'Install and Launch', 2, 10),
  (2, 'signin', 'Sign In with GitHub', 3, 5),
  (2, 'configure', 'Configure AI Features', 4, 15),
  (2, 'first-project', 'Create Your First Project', 5, 20)
ON CONFLICT (module_id, slug) DO NOTHING;

-- 9. Insert steps for Supabase module (Module 3)
INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes) VALUES
  (3, 'account', 'Create Supabase Account with GitHub', 1, 5),
  (3, 'project', 'Create New Project', 2, 10),
  (3, 'github-auth', 'Enable GitHub Authentication', 3, 10),
  (3, 'table', 'Create Your First Table', 4, 15),
  (3, 'credentials', 'Get API Credentials', 5, 5),
  (3, 'initialize', 'Initialize Supabase Client', 6, 10),
  (3, 'query', 'Query Your Database', 7, 20)
ON CONFLICT (module_id, slug) DO NOTHING;

-- 10. Insert steps for Netlify module (Module 4)
INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes) VALUES
  (4, 'signup', 'Sign Up for Netlify with GitHub', 1, 5),
  (4, 'connect-repo', 'Connect Your GitHub Repository', 2, 10),
  (4, 'configure-build', 'Configure Build Settings', 3, 10),
  (4, 'deploy', 'Deploy Your Site', 4, 10),
  (4, 'custom-domain', 'Custom Domain (Optional)', 5, 15)
ON CONFLICT (module_id, slug) DO NOTHING;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users Profile Policies
CREATE POLICY "Users can view their own profile" ON users_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users_profile
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Modules Policies (public read)
CREATE POLICY "Anyone can view active modules" ON modules
  FOR SELECT USING (is_active = true);

-- Steps Policies (public read)
CREATE POLICY "Anyone can view steps" ON steps
  FOR SELECT USING (true);

-- User Progress Policies
CREATE POLICY "Users can view their own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Messages Policies
CREATE POLICY "Anyone can view messages" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users_profile
CREATE TRIGGER update_users_profile_updated_at
  BEFORE UPDATE ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_progress
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, full_name, github_username, github_avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON user_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON user_progress(status);
CREATE INDEX IF NOT EXISTS idx_steps_module_id ON steps(module_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- ==========================================
-- VIEWS FOR EASIER QUERIES
-- ==========================================

-- View to get user progress summary
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT 
  up.user_id,
  m.id AS module_id,
  m.slug AS module_slug,
  m.title AS module_title,
  COUNT(s.id) AS total_steps,
  COUNT(CASE WHEN up.status = 'completed' THEN 1 END) AS completed_steps,
  COUNT(CASE WHEN up.status = 'in_progress' THEN 1 END) AS in_progress_steps,
  ROUND(
    (COUNT(CASE WHEN up.status = 'completed' THEN 1 END)::NUMERIC / COUNT(s.id)) * 100,
    2
  ) AS completion_percentage
FROM modules m
LEFT JOIN steps s ON s.module_id = m.id
LEFT JOIN user_progress up ON up.step_id = s.id
WHERE m.is_active = true
GROUP BY up.user_id, m.id, m.slug, m.title
ORDER BY m.order_number;

-- Grant access to the view
GRANT SELECT ON user_progress_summary TO authenticated;

-- ==========================================
-- SAMPLE DATA (Optional - for testing)
-- ==========================================

-- You can uncomment this to test with sample data
-- INSERT INTO messages (content, username) VALUES 
--   ('Welcome to AI Classroom! 🎓', 'System'),
--   ('Excited to learn full-stack development!', 'Student1');

COMMIT;

-- ==========================================
-- SETUP COMPLETE! 
-- ==========================================
-- Next steps:
-- 1. Enable GitHub OAuth in Supabase Authentication settings
-- 2. Copy your Supabase URL and anon key
-- 3. Update config.js with your credentials

