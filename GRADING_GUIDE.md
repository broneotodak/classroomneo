# 📊 Assignment Grading Guide

## Two Ways to Grade Submissions

Your ClassroomNeo platform now supports **two grading methods**:

1. **🤖 AI Auto-Grading** - Instant, automated grading using OpenAI
2. **👨‍🏫 Manual Grading** - Trainer/admin manually grades with custom feedback

---

## 🤖 Option 1: AI Auto-Grading

### Setup (One-Time)

1. **Get OpenAI API Key:**
   - Go to https://platform.openai.com/api-keys
   - Sign in or create account
   - Click "Create new secret key"
   - Copy the key (starts with `sk-...`)

2. **Add to config.js:**
   ```javascript
   openai: {
     apiKey: 'sk-your-actual-key-here',
     enabled: true,
   }
   ```

### How It Works

**Automatic Grading:**
- When a student submits an assignment, AI grades it automatically
- Status changes: `pending` → `grading` → `graded`
- Student sees grade instantly

**Manual Trigger:**
- If auto-grading is disabled, students/trainers can click:
  - **"🤖 Request AI Grading Now"** button
- AI analyzes the submission and provides:
  - Score (1-5 stars)
  - Overall feedback
  - What they did well
  - How to improve
  - Detailed analysis

### AI Grading Features

✅ Analyzes URL submissions (visits the link)  
✅ Analyzes file uploads (images, PDFs, etc.)  
✅ Reads student notes  
✅ Uses assignment rubric for consistency  
✅ Provides constructive, encouraging feedback  
✅ Works 24/7, grades instantly  

### Cost

- **GPT-4o:** ~$0.005 per grading (~0.5¢)
- **GPT-4 Vision:** ~$0.01 per image grading (~1¢)
- For 100 students: ~$0.50 - $1.00

---

## 👨‍🏫 Option 2: Manual Grading

### Who Can Grade Manually?

- ✅ Admins
- ✅ Trainers
- ❌ Students (can only view their own grades)

### How to Grade Manually

1. **View Submission:**
   - Navigate to the assignment
   - Click **"View Submission"** on a pending submission
   - Or from Admin Dashboard, view all submissions

2. **Click "Grade Manually":**
   - Opens a grading modal with:
     - Student's submission (URL, file, notes)
     - Star rating selector (1-5)
     - Feedback fields

3. **Fill Out Grading Form:**
   - **Score:** Click 1-5 stars (default: 5)
   - **Overall Feedback:** Required - main comments
   - **What They Did Well:** Optional - highlight strengths
   - **How to Improve:** Optional - suggestions

4. **Submit Grade:**
   - Click **"Submit Grade"**
   - Grade saved to database
   - Status changes to `graded`
   - Student sees grade immediately

### Manual Grading Features

✅ Full control over score and feedback  
✅ Custom, personalized feedback  
✅ No API costs  
✅ Great for complex assignments  
✅ Can override AI grades if needed  

---

## 🔄 Hybrid Approach (Recommended)

**Best Practice:**
1. Enable AI auto-grading for most assignments
2. Trainers review AI grades in dashboard
3. Use manual grading for:
   - Complex projects
   - Final assessments
   - When students dispute AI grades
   - Special cases needing human judgment

---

## 📊 How Grades Display

### For Students:

```
┌─────────────────────────────────────┐
│ Your Grade: ⭐⭐⭐⭐⭐ (5/5)          │
│                                     │
│ 📝 Feedback:                        │
│ Excellent work! Your website is... │
│                                     │
│ ✅ What You Did Well:               │
│ - Clean, semantic HTML              │
│ - Responsive design                 │
│                                     │
│ 💡 How to Improve:                  │
│ - Add more interactivity            │
│ - Optimize images                   │
│                                     │
│ Graded by: 🤖 AI Assistant          │
└─────────────────────────────────────┘
```

### On Dashboard:

- **Overall Progress:** Shows as `22/22` steps (or `21/22` if ungraded)
- **Assignment Count:** Shows `1/1` when graded
- **Module Progress:** Updates to 100% when all assignments graded
- **Grade Badge:** Green star badge with score

---

## 🎯 When to Use Each Method

### Use AI Grading For:
- ✅ Quick assignments (deploy a site, submit a link)
- ✅ High volume (50+ students)
- ✅ Standardized rubrics
- ✅ Instant feedback needs
- ✅ Simple file submissions

### Use Manual Grading For:
- ✅ Complex projects (capstone, final projects)
- ✅ Subjective assessments (creative work, essays)
- ✅ When personal touch matters
- ✅ Small classes (< 20 students)
- ✅ Disputed grades

---

## 🔒 Security & Privacy

✅ Students see only their own submissions/grades  
✅ Trainers/admins see all submissions  
✅ RLS (Row Level Security) enforced  
✅ Files stored securely in Supabase Storage  
✅ Grades cannot be edited by students  
✅ All grading actions logged with timestamps  

---

## 🚀 Testing Your Setup

### Test AI Grading:

1. Log in as a student
2. Submit an assignment (URL or file)
3. Watch status change to "grading"
4. See grade appear within 10-30 seconds
5. Check dashboard - assignment count should update

### Test Manual Grading:

1. Log in as admin/trainer
2. View a pending submission
3. Click "Grade Manually"
4. Fill out form with 5 stars and feedback
5. Submit - verify grade displays correctly
6. Check dashboard updates

---

## 📈 Monitoring Grading

### Check Grading Status:

```sql
-- View all submissions and their status
SELECT 
  s.id,
  u.email as student,
  a.title as assignment,
  s.status,
  s.submitted_at,
  s.graded_at,
  g.score,
  g.grader_type
FROM submissions s
JOIN auth.users u ON s.student_id = u.id
JOIN assignments a ON s.assignment_id = a.id
LEFT JOIN grades g ON g.submission_id = s.id
ORDER BY s.submitted_at DESC;
```

### Common Issues:

**"Assignment still shows 0/1":**
- Check submission status (must be `graded`)
- Verify grade exists in `grades` table
- Refresh the page

**"AI grading button doesn't appear":**
- Check `CONFIG.openai.enabled = true`
- Verify API key starts with `sk-`
- Check browser console for errors

**"Manual grade not saving":**
- Verify you're logged in as admin/trainer
- Check RLS policies on `grades` table
- Ensure feedback is not empty

---

## 🎓 Next Steps

1. ✅ **Test both grading methods** with your submission
2. ✅ Create more assignments with different rubrics
3. ✅ Invite students to submit work
4. ✅ Monitor AI grading quality
5. ✅ Adjust rubrics based on results
6. ✅ Set up automated grading workflows

---

**Ready to grade?** Go to your submission and try both methods! 🚀

