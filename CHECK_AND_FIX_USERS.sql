-- ==========================================
-- CHECK AND FIX USER SIGNUP TRIGGER
-- ==========================================

-- Step 1: Check if users_profile table has your friends
SELECT 
  id,
  email,
  github_username,
  role,
  created_at
FROM users_profile
ORDER BY created_at DESC
LIMIT 10;

-- Step 2: Check if there are auth.users without profiles
SELECT 
  au.id,
  au.email,
  au.created_at,
  up.id as profile_exists
FROM auth.users au
LEFT JOIN users_profile up ON up.id = au.id
WHERE up.id IS NULL
ORDER BY au.created_at DESC;

-- Step 3: Recreate the trigger function (in case it's broken)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, full_name, github_username, github_avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'student'  -- Default role is student
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Manually create profiles for existing users who don't have them
INSERT INTO public.users_profile (id, email, full_name, github_username, github_avatar_url, role)
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name',
  au.raw_user_meta_data->>'user_name',
  au.raw_user_meta_data->>'avatar_url',
  'student' as role
FROM auth.users au
LEFT JOIN users_profile up ON up.id = au.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 6: Verify all users now have profiles
SELECT 
  COUNT(*) as total_auth_users,
  (SELECT COUNT(*) FROM users_profile) as total_profiles,
  COUNT(*) - (SELECT COUNT(*) FROM users_profile) as missing_profiles
FROM auth.users;

-- Step 7: Show all users with their roles
SELECT 
  up.github_username,
  up.email,
  up.role,
  up.created_at,
  up.last_login
FROM users_profile up
ORDER BY up.created_at DESC;

