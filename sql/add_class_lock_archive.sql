-- ==========================================
-- ADD LOCK AND ARCHIVE FEATURES TO CLASSES
-- ==========================================

-- Add is_locked column (prevents modifications to class content)
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- Add is_archived column (hides class from active lists)
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Add locked_at and locked_by for audit trail
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add archived_at and archived_by for audit trail
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_is_locked ON classes(is_locked);
CREATE INDEX IF NOT EXISTS idx_classes_is_archived ON classes(is_archived);

-- Add comments
COMMENT ON COLUMN classes.is_locked IS 'When true, prevents modifications to class content (modules, steps, assignments)';
COMMENT ON COLUMN classes.is_archived IS 'When true, hides class from active lists (but keeps data for history)';

-- Function to lock a class (admin only)
CREATE OR REPLACE FUNCTION lock_class(p_class_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Check if caller is admin
  SELECT id INTO v_admin_id
  FROM users_profile
  WHERE id = auth.uid() AND role = 'admin';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can lock classes';
  END IF;

  -- Lock the class
  UPDATE classes
  SET
    is_locked = TRUE,
    locked_at = NOW(),
    locked_by = v_admin_id
  WHERE id = p_class_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Class not found';
  END IF;

  RETURN TRUE;
END;
$$;

-- Function to unlock a class (admin only)
CREATE OR REPLACE FUNCTION unlock_class(p_class_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Check if caller is admin
  SELECT id INTO v_admin_id
  FROM users_profile
  WHERE id = auth.uid() AND role = 'admin';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can unlock classes';
  END IF;

  -- Unlock the class
  UPDATE classes
  SET
    is_locked = FALSE,
    locked_at = NULL,
    locked_by = NULL
  WHERE id = p_class_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Class not found';
  END IF;

  RETURN TRUE;
END;
$$;

-- Function to archive a class (admin only)
CREATE OR REPLACE FUNCTION archive_class(p_class_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Check if caller is admin
  SELECT id INTO v_admin_id
  FROM users_profile
  WHERE id = auth.uid() AND role = 'admin';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can archive classes';
  END IF;

  -- Archive the class
  UPDATE classes
  SET
    is_archived = TRUE,
    archived_at = NOW(),
    archived_by = v_admin_id,
    is_active = FALSE  -- Also mark as inactive
  WHERE id = p_class_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Class not found';
  END IF;

  RETURN TRUE;
END;
$$;

-- Function to unarchive a class (admin only)
CREATE OR REPLACE FUNCTION unarchive_class(p_class_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Check if caller is admin
  SELECT id INTO v_admin_id
  FROM users_profile
  WHERE id = auth.uid() AND role = 'admin';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can unarchive classes';
  END IF;

  -- Unarchive the class
  UPDATE classes
  SET
    is_archived = FALSE,
    archived_at = NULL,
    archived_by = NULL
  WHERE id = p_class_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Class not found';
  END IF;

  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION lock_class(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_class(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_class(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION unarchive_class(INTEGER) TO authenticated;
