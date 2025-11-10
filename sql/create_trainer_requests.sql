-- ==========================================
-- TRAINER REQUEST SYSTEM
-- ==========================================
-- Allows students to request trainer role
-- Admins can approve/reject requests

-- Create trainer_requests table
CREATE TABLE IF NOT EXISTS trainer_requests (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trainer_requests_user_id ON trainer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_requests_status ON trainer_requests(status);
CREATE INDEX IF NOT EXISTS idx_trainer_requests_created_at ON trainer_requests(created_at DESC);

-- Enable RLS
ALTER TABLE trainer_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can view their own requests
CREATE POLICY "Users can view own requests"
  ON trainer_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Students can create requests (only if they don't have a pending one)
CREATE POLICY "Users can create requests"
  ON trainer_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM trainer_requests
      WHERE user_id = auth.uid()
      AND status = 'pending'
    )
  );

-- Admins can view all requests
CREATE POLICY "Admins view all requests"
  ON trainer_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update requests"
  ON trainer_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Update timestamp trigger
DROP TRIGGER IF EXISTS update_trainer_requests_updated_at ON trainer_requests;
CREATE TRIGGER update_trainer_requests_updated_at
  BEFORE UPDATE ON trainer_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to approve trainer request
CREATE OR REPLACE FUNCTION approve_trainer_request(request_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_admin_id UUID;
BEGIN
  -- Check if caller is admin
  SELECT id INTO v_admin_id
  FROM users_profile
  WHERE id = auth.uid() AND role = 'admin';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can approve requests';
  END IF;

  -- Get user_id from request
  SELECT user_id INTO v_user_id
  FROM trainer_requests
  WHERE id = request_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Update request status
  UPDATE trainer_requests
  SET
    status = 'approved',
    reviewed_by = v_admin_id,
    reviewed_at = NOW()
  WHERE id = request_id;

  -- Upgrade user to trainer role
  UPDATE users_profile
  SET role = 'trainer'
  WHERE id = v_user_id;

  RETURN TRUE;
END;
$$;

-- Function to reject trainer request
CREATE OR REPLACE FUNCTION reject_trainer_request(request_id INTEGER, notes TEXT DEFAULT NULL)
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
    RAISE EXCEPTION 'Only admins can reject requests';
  END IF;

  -- Update request status
  UPDATE trainer_requests
  SET
    status = 'rejected',
    reviewed_by = v_admin_id,
    reviewed_at = NOW(),
    admin_notes = notes
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_trainer_request(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_trainer_request(INTEGER, TEXT) TO authenticated;

-- Add comment
COMMENT ON TABLE trainer_requests IS 'Stores requests from students who want to become trainers';
