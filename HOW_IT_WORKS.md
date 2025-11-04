# 🎓 AI Classroom - How It Works

## 📊 Database Structure

```
users_profile
├── id (UUID)
├── github_username
├── email
├── role (student, trainer, admin)
└── ...

classes
├── id
├── name
├── trainer_id → users_profile
├── start_date
├── end_date
└── is_active

class_enrollments
├── class_id → classes
├── student_id → users_profile
└── status (active, completed, dropped)

modules ⭐ CLASS-SPECIFIC
├── id
├── class_id → classes  ← Each module belongs to ONE class
├── slug
├── title
└── order_number

steps
├── id
├── module_id → modules
├── title
└── estimated_minutes

user_progress
├── user_id → users_profile
├── step_id → steps
├── status (not_started, in_progress, completed)
└── completed_at
```

---

## 🔐 Access Control (Row Level Security)

### **Students:**
- ✅ Can view classes where `is_active = true`
- ✅ Can enroll themselves in classes
- ✅ Can ONLY see modules from classes they're enrolled in
- ✅ Can ONLY see steps from their enrolled class modules
- ✅ Can track their own progress

### **Trainers:**
- ✅ All student permissions
- ✅ Can create classes
- ✅ Can view all modules/steps (even in other classes)
- ✅ Can enroll students in their classes
- ✅ Can view students in their classes
- ✅ Can enroll in their own classes (for testing)

### **Admins:**
- ✅ All trainer permissions
- ✅ Can view ALL students
- ✅ Can view ALL classes
- ✅ Can update any user's role
- ✅ Can delete any class

---

## 🎯 User Journeys

### **Student Flow:**

```
1. Sign in with GitHub
   ↓
2. Auto-created as 'student' in users_profile
   ↓
3. See Dashboard with "Available Classes"
   ↓
4. Click "Join Class"
   ↓
5. Modules appear in "Your Modules" section
   ↓
6. Click "Start" on a module
   ↓
7. Navigate through steps
   ↓
8. Mark steps complete
   ↓
9. Progress tracked automatically
```

### **Trainer/Admin Flow:**

```
1. Sign in with GitHub
   ↓
2. Admin sets role to 'trainer' or 'admin' via SQL
   ↓
3. See "👨‍🏫 Admin" tab in navigation
   ↓
4. Create Class
   ↓
5. Modules auto-created (via CHECK_MODULES.sql)
   ↓
6. Assign students OR students self-enroll
   ↓
7. Monitor progress in Admin Dashboard
   ↓
8. Can also enroll yourself to test
```

---

## 🔄 Class → Modules Relationship

### **Each Class Gets:**
- ✅ Its OWN set of modules (not shared)
- ✅ Modules created when class is created
- ✅ Students see ONLY modules from enrolled classes

### **Example:**

```
Class: "Todak Studios Bandung 2025"
├── Module 1: GitHub Account Setup (5 steps)
├── Module 2: Cursor AI Setup (5 steps)
├── Module 3: Supabase Backend (7 steps)
└── Module 4: Netlify Deployment (5 steps)

Class: "Spring 2026 Bootcamp"
├── Module 1: GitHub Account Setup (5 steps) ← DIFFERENT from above
├── Module 2: Cursor AI Setup (5 steps)       ← DIFFERENT from above
├── Module 3: Supabase Backend (7 steps)      ← DIFFERENT from above
└── Module 4: Netlify Deployment (5 steps)    ← DIFFERENT from above
```

Each class's modules are **completely independent**. You can:
- Customize content per class
- Add/remove modules per class
- Different step sequences per class

---

## 🚀 Creating New Classes

### **Current Method:**

1. **In UI:** Click "Create Class" → Fill form → Submit
2. **In Supabase:** Run this SQL:
   ```sql
   -- Get the class ID
   SELECT id, name FROM classes ORDER BY created_at DESC LIMIT 1;
   
   -- Create modules for that class (replace X with class id)
   -- Use CHECK_MODULES.sql or create manually
   ```

### **Future with AI Builder:**

1. Click "🤖 AI Module Builder"
2. Select your class
3. Describe curriculum: "Create a React course..."
4. AI generates modules and steps
5. Preview and save

---

## 📊 Data Isolation

### **Important: Each Class Is Isolated**

- ✅ Class A's modules ≠ Class B's modules
- ✅ Students see only their enrolled class modules
- ✅ Progress is tracked per module (which belongs to a class)
- ✅ You can have 10 classes, all with different curricula

### **Verification Query:**

Run `VERIFY_CLASS_MODULES.sql` to confirm:
```sql
SELECT 
  m.title as module,
  c.name as belongs_to_class,
  m.class_id
FROM modules m
JOIN classes c ON c.id = m.class_id;
```

---

## 🎓 Scalability

### **Current Setup:**
- ✅ 1 class with 4 modules
- ✅ 22 total steps
- ✅ Multiple students can enroll

### **Future:**
- Add more classes
- Each gets its own modules
- Different curricula per class
- Track progress separately

---

## 🔍 Key Database Queries

### **See all students in a class:**
```sql
SELECT 
  u.github_username,
  ce.status,
  ce.enrolled_at
FROM class_enrollments ce
JOIN users_profile u ON u.id = ce.student_id
WHERE ce.class_id = 1  -- Your class ID
ORDER BY ce.enrolled_at;
```

### **See modules in a specific class:**
```sql
SELECT 
  m.title,
  COUNT(s.id) as step_count
FROM modules m
LEFT JOIN steps s ON s.module_id = m.id
WHERE m.class_id = 1  -- Your class ID
GROUP BY m.id, m.title
ORDER BY m.order_number;
```

### **Student progress in a class:**
```sql
SELECT 
  u.github_username,
  m.title as module,
  s.title as step,
  up.status,
  up.completed_at
FROM user_progress up
JOIN steps s ON s.id = up.step_id
JOIN modules m ON m.id = s.module_id
JOIN users_profile u ON u.id = up.user_id
WHERE m.class_id = 1  -- Your class ID
ORDER BY u.github_username, m.order_number, s.order_number;
```

---

## ✅ Summary

Your system now has:
- ✅ Proper hierarchy: Trainer → Class → Modules → Steps
- ✅ Class-specific curricula
- ✅ Students join classes to access content
- ✅ Trainers can test their own classes
- ✅ Complete isolation between classes
- ✅ Scalable for multiple cohorts
- ✅ AI builder UI ready (backend coming soon)

**Each class is its own learning environment!** 🎉

