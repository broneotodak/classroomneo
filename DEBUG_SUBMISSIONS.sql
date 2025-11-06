-- ==========================================
-- DEBUG: Why Are Student Names "Unknown"?
-- ==========================================

-- 1. Check all submissions and their student_ids
SELECT 
  s.id as submission_id,
  s.student_id,
  s.assignment_id,
  s.status,
  s.submitted_at
FROM submissions s
ORDER BY s.submitted_at DESC
LIMIT 10;

-- 2. Check if those student_ids have profiles
SELECT 
  s.student_id,
  up.id as profile_id,
  up.github_username,
  up.github_avatar_url,
  up.role,
  CASE 
    WHEN up.id IS NULL THEN '❌ NO PROFILE'
    WHEN up.github_username IS NULL THEN '⚠️ NULL USERNAME'
    WHEN up.github_username = '' THEN '⚠️ EMPTY USERNAME'
    ELSE '✅ HAS PROFILE'
  END as status
FROM submissions s
LEFT JOIN users_profile up ON up.id = s.student_id
ORDER BY s.submitted_at DESC
LIMIT 10;

-- 3. Check auth.users data for those student_ids
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'user_name' as github_username,
  au.raw_user_meta_data->>'avatar_url' as github_avatar,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.created_at
FROM auth.users au
WHERE au.id IN (
  SELECT DISTINCT student_id FROM submissions
)
ORDER BY au.created_at DESC;

-- 4. Show the JOIN that's failing
SELECT 
  s.id,
  s.student_id,
  up.github_username,
  a.title as assignment,
  CASE 
    WHEN up.github_username IS NOT NULL THEN '✅ Has username'
    ELSE '❌ Missing username'
  END as debug
FROM submissions s
LEFT JOIN users_profile up ON up.id = s.student_id
LEFT JOIN assignments a ON a.id = s.assignment_id
ORDER BY s.submitted_at DESC
LIMIT 10;

-- ==========================================
-- THE FIX
-- ==========================================

-- If the above queries show missing profiles, run this:

INSERT INTO users_profile (id, role, github_username, github_avatar_url, created_at)
SELECT 
  id,
  'student' as role,
  COALESCE(
    raw_user_meta_data->>'user_name',
    raw_user_meta_data->>'full_name',
    split_part(email, '@', 1),
    'student_' || substr(id::text, 1, 8)
  ) as github_username,
  COALESCE(
    raw_user_meta_data->>'avatar_url',
    'https://ui-avatars.com/api/?name=' || split_part(email, '@', 1)
  ) as github_avatar_url,
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM users_profile)
ON CONFLICT (id) DO NOTHING;

-- Update NULL usernames
UPDATE users_profile up
SET github_username = COALESCE(
  NULLIF(up.github_username, ''),
  au.raw_user_meta_data->>'user_name',
  split_part(au.email, '@', 1),
  'user_' || substr(up.id::text, 1, 8)
)
FROM auth.users au
WHERE up.id = au.id
  AND (up.github_username IS NULL OR up.github_username = '');

-- ==========================================
-- VERIFY THE FIX
-- ==========================================

SELECT 
  s.id,
  up.github_username as student_name,
  a.title as assignment,
  s.status,
  g.score
FROM submissions s
LEFT JOIN users_profile up ON up.id = s.student_id
LEFT JOIN assignments a ON a.id = s.assignment_id
LEFT JOIN grades g ON g.submission_id = s.id
ORDER BY s.submitted_at DESC
LIMIT 10;

SELECT 
  '✅ Check results above. If student_name is not NULL, the fix worked!' as message;

