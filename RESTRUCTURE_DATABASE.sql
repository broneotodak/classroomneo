-- ==========================================
-- RESTRUCTURE DATABASE: Trainer → Class → Modules
-- ==========================================
-- This creates the proper hierarchy where modules belong to classes

-- Step 1: Add class_id to modules table
ALTER TABLE modules ADD COLUMN IF NOT EXISTS class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE;

-- Step 2: Make modules viewable only by enrolled students or public if no class
DROP POLICY IF EXISTS "Anyone can view active modules" ON modules;

-- Students can view modules in their enrolled classes
CREATE POLICY "Students can view modules in enrolled classes" ON modules
  FOR SELECT USING (
    is_active = true AND (
      class_id IS NULL OR  -- Public modules
      EXISTS (
        SELECT 1 FROM class_enrollments ce
        WHERE ce.class_id = modules.class_id 
        AND ce.student_id = auth.uid()
        AND ce.status = 'active'
      )
    )
  );

-- Admins and trainers can view all modules
CREATE POLICY "Admins and trainers can view all modules" ON modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Step 3: Update existing modules to belong to default class
-- First, let's see what classes exist
SELECT id, name FROM classes ORDER BY id;

-- Step 4: Create default modules for all new classes
-- (Run this manually for each class you create, or we'll automate it later)

-- Example: Assign modules to a specific class
-- UPDATE modules SET class_id = 1 WHERE slug IN ('github-signup', 'cursor', 'supabase', 'netlify');

-- Step 5: Create a function to duplicate modules for new classes
CREATE OR REPLACE FUNCTION create_class_with_modules(
  p_class_name TEXT,
  p_description TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_class_id INTEGER;
  v_module RECORD;
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

  -- Copy template modules (class_id IS NULL) to this class
  INSERT INTO modules (slug, title, description, order_number, is_active, class_id)
  SELECT 
    slug || '-class-' || v_class_id,  -- Make slug unique per class
    title,
    description,
    order_number,
    is_active,
    v_class_id
  FROM modules
  WHERE class_id IS NULL;

  -- Copy steps for each new module
  FOR v_module IN 
    SELECT m_new.id as new_module_id, m_template.id as template_module_id
    FROM modules m_new
    JOIN modules m_template ON m_template.slug = REPLACE(m_new.slug, '-class-' || v_class_id, '')
    WHERE m_new.class_id = v_class_id AND m_template.class_id IS NULL
  LOOP
    INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes)
    SELECT 
      v_module.new_module_id,
      slug,
      title,
      order_number,
      estimated_minutes
    FROM steps
    WHERE module_id = v_module.template_module_id;
  END LOOP;

  RETURN v_class_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_class_with_modules TO authenticated;

-- Step 6: For existing classes, link to template modules (temporary solution)
-- This makes current modules work for all classes
-- You can later customize per class

COMMENT ON TABLE modules IS 'Modules can be class-specific (class_id set) or templates (class_id NULL)';

-- Step 7: Show current structure
SELECT 
  'Classes' as type, 
  id::TEXT, 
  name as title, 
  'Trainer: ' || trainer_id::TEXT as info
FROM classes
UNION ALL
SELECT 
  'Modules' as type,
  id::TEXT,
  title,
  'Class: ' || COALESCE(class_id::TEXT, 'Template') as info  
FROM modules
ORDER BY type, id;

