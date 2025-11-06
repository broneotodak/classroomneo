-- ==========================================
-- Storage Policies for Assignment Submissions
-- ==========================================
-- Run this in Supabase SQL Editor

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own uploaded files
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignment-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow trainers and admins to view all files
CREATE POLICY "Trainers can view all files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignment-submissions' AND
  EXISTS (
    SELECT 1 FROM public.users_profile
    WHERE id = auth.uid() AND role IN ('admin', 'trainer')
  )
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignment-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify policies
SELECT 
  policyname,
  action,
  target
FROM storage.policies
WHERE bucket_id = 'assignment-submissions';

SELECT '✅ Storage policies created! Students can now upload files.' as result;

