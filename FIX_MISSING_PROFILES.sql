-- ==========================================
-- Fix Missing User Profiles
-- ==========================================

-- Create profiles for any users who don't have one yet
INSERT INTO users_profile (id, role, github_username, github_avatar_url, created_at)
SELECT 
  id,
  'student' as role,
  COALESCE(raw_user_meta_data->>'user_name', raw_user_meta_data->>'full_name', email) as github_username,
  COALESCE(raw_user_meta_data->>'avatar_url', 'https://ui-avatars.com/api/?name=' || email) as github_avatar_url,
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM users_profile)
ON CONFLICT (id) DO NOTHING;

-- Update existing profiles with missing GitHub data
UPDATE users_profile up
SET 
  github_username = COALESCE(
    up.github_username, 
    au.raw_user_meta_data->>'user_name',
    au.raw_user_meta_data->>'full_name',
    au.email
  ),
  github_avatar_url = COALESCE(
    up.github_avatar_url,
    au.raw_user_meta_data->>'avatar_url',
    'https://ui-avatars.com/api/?name=' || au.email
  )
FROM auth.users au
WHERE up.id = au.id
  AND (up.github_username IS NULL OR up.github_avatar_url IS NULL);

-- Show results
SELECT 
  id,
  github_username,
  github_avatar_url,
  role,
  created_at
FROM users_profile
ORDER BY created_at DESC;

SELECT '✅ User profiles fixed! All users now have display names and avatars.' as result;

