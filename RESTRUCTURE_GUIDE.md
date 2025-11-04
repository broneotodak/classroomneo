# 🔄 Database Restructure Guide

## 📋 Overview

We're restructuring from:
```
❌ OLD: Modules (global) ← Students can access directly
```

To:
```
✅ NEW: Trainer → Class → Modules → Steps
       Students must join class first to see modules
```

---

## 🚀 Step-by-Step Instructions

### **Step 1: Run the Restructure SQL** (5 min)

1. Open your **Supabase SQL Editor**
2. Copy the **entire** `FINAL_RESTRUCTURE.sql` file
3. Paste and click **"Run"**
4. You should see at the end:
   ```
   ✅ Database restructure complete!
   ```

### **What This Does:**
- ✅ Adds `class_id` column to `modules` table
- ✅ Deletes old template modules (if any)
- ✅ Creates modules for your existing class
- ✅ Creates all 4 modules (GitHub, Cursor, Supabase, Netlify)
- ✅ Creates all 26 steps
- ✅ Updates RLS policies
- ✅ Creates helper function for future classes
- ✅ **Auto-enrolls you (the trainer) in your own class!**

---

### **Step 2: Verify in Supabase** (1 min)

Run this query to check:
```sql
SELECT 
  c.name as class_name,
  m.title as module_title,
  COUNT(s.id) as step_count
FROM classes c
JOIN modules m ON m.class_id = c.id
JOIN steps s ON s.module_id = m.id
GROUP BY c.name, m.title
ORDER BY c.name, m.order_number;
```

You should see:
```
Todak Studios Bandung 2025 | GitHub Account Setup    | 5
Todak Studios Bandung 2025 | Cursor AI Setup         | 5
Todak Studios Bandung 2025 | Supabase Backend        | 7
Todak Studios Bandung 2025 | Netlify Deployment      | 5
```

---

### **Step 3: Test as Trainer/Admin** (2 min)

1. **Wait for Netlify to deploy** (check dashboard)
2. **Visit:** https://classroom.neotodak.com
3. **Hard refresh:** `Cmd + Shift + R`
4. **Sign in** as broneotodak
5. **Go to Dashboard**
6. You should now see:
   - ✅ "Available Classes" section (yes, even as admin!)
   - ✅ Your class: "Todak Studios Bandung 2025"
   - ✅ **"Join Class"** button OR **"✅ Enrolled"** (if auto-enrolled by SQL)
7. **If you see "Join Class"**, click it to join
8. **Refresh the page**
9. You should now see:
   - ✅ 4 modules appear in "Your Modules" section
   - ✅ Each with 0% progress

---

### **Step 4: Test as Student** (2 min)

Have **faris-rahim** or your new student:

1. **Hard refresh** the page
2. **Sign in with GitHub**
3. **Go to Dashboard**
4. They should see:
   - ✅ "Available Classes" section
   - ✅ Your class listed
   - ✅ "Join Class" button
5. **Click "Join Class"**
6. **Confirm**
7. **Refresh page**
8. They should now see:
   - ✅ 4 modules appear
   - ✅ Can click "Start" on any module
   - ✅ Can begin learning!

---

## 🎯 **New User Flow:**

```
Student Journey:
1. Sign in with GitHub
2. See "Available Classes"
3. Click "Join Class"
4. Modules appear in dashboard
5. Start learning!

Admin/Trainer Journey (Testing):
1. Create class (auto-creates modules)
2. Join your own class
3. Test all features as a student would
4. See student roster
5. Manage enrollments
```

---

## 🔍 **Expected Behavior After Restructure:**

### **Before Joining a Class:**
- Student sees: "Available Classes" section
- Modules section shows: "No Modules Available - Join a class above!"
- Student roster shows: "Not assigned"

### **After Joining a Class:**
- Student sees: "✅ Enrolled" badge on class card
- Modules section shows: 4 learning modules
- Student roster shows: "Todak Studios Bandung 2025"
- Student can start learning modules

---

## 🎓 **Future Class Creation:**

When you create future classes, they'll automatically get modules!

**Option A: Via UI (Current):**
1. Click "Create Class"
2. Fill form
3. Click "Create Class"
4. ⚠️ **Then manually run:**
   ```sql
   SELECT create_class_with_default_modules(
     'New Class Name',
     'Description',
     '2025-12-01',
     '2026-03-01'
   );
   ```

**Option B: Use the SQL Function (Easier):**
Just run:
```sql
SELECT create_class_with_default_modules(
  'Spring 2026 Cohort',
  'Learn full-stack development',
  '2026-01-15',
  '2026-04-15'
);
```

This creates the class AND all modules in one go!

---

## ✅ **Checklist:**

- [ ] Run `FINAL_RESTRUCTURE.sql` in Supabase
- [ ] Verify modules created (run verification query)
- [ ] Wait for Netlify deployment
- [ ] Hard refresh browser
- [ ] Test as admin: Join your class
- [ ] See 4 modules appear
- [ ] Have faris test: Join class, see modules
- [ ] Try starting a module and completing steps

---

## 🐛 **If Something Goes Wrong:**

**Modules not appearing after joining:**
- Check browser console for errors
- Verify you're enrolled: `SELECT * FROM class_enrollments WHERE student_id = auth.uid();`
- Verify modules exist: `SELECT * FROM modules WHERE class_id = 1;`

**Can't join class:**
- Check RLS policies were created
- Try signing out and back in

**Steps not loading:**
- Check RLS policies for steps table
- Verify steps were created: `SELECT COUNT(*) FROM steps;`

---

## 🎉 **What You'll Get:**

- ✅ Proper class-based learning structure
- ✅ Trainers can test their own classes
- ✅ Students must join before accessing content
- ✅ Better organization and tracking
- ✅ Scalable for multiple classes

**Run the SQL and let me know how it goes!** 🚀

