-- =====================================================
-- ClassroomNeo: Student API Keys Infrastructure
-- Enables Claude Desktop to communicate with ClassroomNeo
-- =====================================================

-- Table for student API keys
CREATE TABLE IF NOT EXISTS student_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
  api_key TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT 'Claude Desktop',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0
);

-- Create index for fast key lookup
CREATE INDEX IF NOT EXISTS idx_student_api_keys_key ON student_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_student_api_keys_user ON student_api_keys(user_id);

-- RLS Policies
ALTER TABLE student_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view their own keys
CREATE POLICY "Users can view own API keys"
  ON student_api_keys FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own keys  
CREATE POLICY "Users can create own API keys"
  ON student_api_keys FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update (revoke) their own keys
CREATE POLICY "Users can update own API keys"
  ON student_api_keys FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own keys
CREATE POLICY "Users can delete own API keys"
  ON student_api_keys FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- API Activity Log (for tracking Claude Desktop usage)
-- =====================================================

CREATE TABLE IF NOT EXISTS api_activity_log (
  id BIGSERIAL PRIMARY KEY,
  api_key_id UUID REFERENCES student_api_keys(id),
  user_id UUID REFERENCES users_profile(id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_activity_user ON api_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_api_activity_time ON api_activity_log(created_at);

-- RLS for activity log
ALTER TABLE api_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
  ON api_activity_log FOR SELECT
  USING (user_id = auth.uid());

-- =====================================================
-- Function to generate API key
-- =====================================================

CREATE OR REPLACE FUNCTION generate_student_api_key(p_user_id UUID, p_name TEXT DEFAULT 'Claude Desktop')
RETURNS TEXT AS $$
DECLARE
  v_key TEXT;
BEGIN
  -- Generate key: crn_ + 32 char random
  v_key := 'crn_' || encode(gen_random_bytes(16), 'hex');
  
  -- Insert the key
  INSERT INTO student_api_keys (user_id, api_key, name)
  VALUES (p_user_id, v_key, p_name);
  
  RETURN v_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function to validate API key and get user
-- =====================================================

CREATE OR REPLACE FUNCTION validate_api_key(p_api_key TEXT)
RETURNS TABLE (
  user_id UUID,
  github_username TEXT,
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    k.user_id,
    u.github_username,
    true as is_valid
  FROM student_api_keys k
  JOIN users_profile u ON k.user_id = u.id
  WHERE k.api_key = p_api_key
    AND k.is_active = true;
    
  -- Update last used
  UPDATE student_api_keys 
  SET last_used_at = NOW(), usage_count = usage_count + 1
  WHERE api_key = p_api_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- View for student progress (used by API)
-- =====================================================

CREATE OR REPLACE VIEW student_progress_summary AS
SELECT 
  up.user_id,
  u.github_username,
  c.id as class_id,
  c.name as class_name,
  COUNT(DISTINCT s.id) as total_steps,
  COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.step_id END) as completed_steps,
  ROUND(
    COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.step_id END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT s.id), 0) * 100, 1
  ) as progress_percentage
FROM users_profile u
CROSS JOIN classes c
LEFT JOIN modules m ON m.class_id = c.id
LEFT JOIN steps s ON s.module_id = m.id
LEFT JOIN user_progress up ON up.user_id = u.id AND up.step_id = s.id
WHERE c.is_active = true
GROUP BY up.user_id, u.github_username, c.id, c.name;

COMMENT ON TABLE student_api_keys IS 'API keys for Claude Desktop integration - allows students to connect their Claude Desktop to ClassroomNeo';
