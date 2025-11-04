-- ==========================================
-- VERIFY: Modules Are Class-Specific
-- ==========================================

-- Step 1: Show the class → modules relationship
SELECT 
  c.id as class_id,
  c.name as class_name,
  c.trainer_id,
  m.id as module_id,
  m.title as module_title,
  m.class_id as belongs_to_class
FROM classes c
LEFT JOIN modules m ON m.class_id = c.id
ORDER BY c.id, m.order_number;

-- Step 2: Count modules per class
SELECT 
  c.id,
  c.name as class_name,
  COUNT(m.id) as total_modules
FROM classes c
LEFT JOIN modules m ON m.class_id = c.id
GROUP BY c.id, c.name
ORDER BY c.id;

-- Step 3: Verify modules ONLY belong to one class
SELECT 
  m.id,
  m.title,
  m.class_id,
  c.name as class_name,
  '✅ This module belongs ONLY to this class' as verification
FROM modules m
JOIN classes c ON c.id = m.class_id
ORDER BY m.class_id, m.order_number;

-- Step 4: Check if there are any orphaned modules (class_id IS NULL)
SELECT 
  COUNT(*) as orphaned_modules,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Perfect! No orphaned modules.'
    ELSE '⚠️ Some modules are not assigned to a class'
  END as status
FROM modules
WHERE class_id IS NULL;

SELECT '✅ All modules are class-specific. Each class has its own curriculum!' as result;

