-- =====================================================
-- ClassroomNeo: Claude Desktop Mastery Course Setup
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, let's check if the class exists, if not create it
INSERT INTO classes (name, description, trainer_id, start_date, end_date, is_active)
SELECT 
  'Claude Desktop Mastery',
  'Master Claude Desktop with MCP servers, extensions, and integrations. Learn to build powerful AI-assisted workflows for web development. Final project: Connect your Claude Desktop to ClassroomNeo!',
  (SELECT id FROM users_profile WHERE role = 'admin' LIMIT 1),
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM classes WHERE name = 'Claude Desktop Mastery'
);

-- Get the class ID
DO $$
DECLARE
  v_class_id INTEGER;
BEGIN
  SELECT id INTO v_class_id FROM classes WHERE name = 'Claude Desktop Mastery';
  
  -- =====================================================
  -- MODULE 1: Introduction to Claude Desktop
  -- =====================================================
  INSERT INTO modules (class_id, title, description, order_number, slug)
  VALUES (
    v_class_id,
    'Module 1: Introduction to Claude Desktop',
    'Understanding Claude Desktop''s architecture and capabilities across different operating systems',
    1,
    'intro-claude-desktop'
  ) ON CONFLICT DO NOTHING;
  
END $$;
