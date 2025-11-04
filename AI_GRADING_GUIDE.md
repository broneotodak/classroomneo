## 🤖 AI-Powered Assignment Grading System

## 📋 Overview

This system allows trainers to create assignments that students can submit, and AI will automatically grade them with detailed feedback.

---

## 🗄️ Database Structure

### **New Tables:**

**`assignments`**
- Attached to specific steps in modules
- Define what students need to submit
- AI grading rubric
- File/URL submission settings

**`submissions`**
- Student work (files, URLs, notes)
- Status tracking (pending → grading → graded)
- Linked to Supabase Storage

**`grades`**
- AI or manual grades (1-5 scale)
- Detailed feedback
- Strengths and improvements
- Technical analysis

---

## 🚀 Setup Instructions

### **Step 1: Run Database Script**

In Supabase SQL Editor, run `ADD_ASSIGNMENTS_SYSTEM.sql`

This creates:
- ✅ All tables and relationships
- ✅ RLS policies
- ✅ Helper functions
- ✅ Views for trainers

### **Step 2: Create Storage Bucket**

1. Go to Supabase Dashboard → **Storage**
2. Click **"New bucket"**
3. Name: `assignment-submissions`
4. Set to **Private**
5. Add policies:

```sql
-- Allow authenticated users to upload their own submissions
CREATE POLICY "Users can upload their submissions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own files
CREATE POLICY "Users can view their own submissions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Trainers and admins can view all files
CREATE POLICY "Trainers can view all submissions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions' AND
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid() AND role IN ('admin', 'trainer')
  )
);
```

### **Step 3: Get OpenAI API Key**

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or sign in
3. Go to **API Keys**
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-...`)
6. Add to `config.js`:

```javascript
openai: {
  apiKey: 'sk-your-actual-key-here',
  enabled: true,
},
```

⚠️ **Security Note:** For production, use environment variables, not hardcoded keys!

---

## 👨‍🏫 Trainer Workflow

### **Creating an Assignment:**

1. Go to Admin Dashboard
2. Navigate to a specific step (future UI)
3. Click "Add Assignment"
4. Fill in:
   - Assignment title
   - Instructions (what to do)
   - AI Grading Rubric (how to grade)
   - Allow file upload? (Yes/No)
   - Allow URL submission? (Yes/No)
   - Due date (optional)
5. Click "Create Assignment"

**Example Assignment:**
```
Title: Deploy Your First Website
Instructions: Create an HTML/CSS website and deploy it to Netlify
Rubric: Grade on: 1) Live and accessible, 2) Clean code, 3) Responsive, 
        4) Professional design, 5) Creativity
Allow URL: Yes
Due Date: 1 week from now
```

### **Viewing Submissions:**

1. See all submissions in admin dashboard
2. Filter by:
   - Class
   - Assignment
   - Status (pending/graded)
3. View student work
4. Trigger AI grading or grade manually

---

## 🎓 Student Workflow

### **Submitting an Assignment:**

1. Navigate to a step with an assignment
2. See assignment details and instructions
3. Submit work:
   - **Upload file** (image, PDF, etc.)
   - **Submit URL** (deployed site, GitHub repo, etc.)
   - **Add notes** (explain your work)
4. Click "Submit Assignment"
5. Status: "Pending Review"

### **AI Grades It:**

1. AI analyzes the submission
2. Checks against rubric
3. Generates:
   - Score (1-5)
   - Overall feedback
   - What you did well
   - How to improve
   - Technical analysis
4. Status: "Graded"

### **Student Sees:**

```
┌─────────────────────────────────────┐
│ Your Grade: ⭐⭐⭐⭐⭐ (5/5)          │
│                                     │
│ 📝 Feedback:                        │
│ Excellent work! Your website is    │
│ well-designed and fully responsive. │
│                                     │
│ ✅ Strengths:                       │
│ - Clean, semantic HTML              │
│ - Beautiful CSS styling             │
│ - Mobile-responsive design          │
│                                     │
│ 💡 Improvements:                    │
│ - Add meta tags for SEO             │
│ - Consider adding accessibility     │
│                                     │
│ 🔍 Technical Analysis:              │
│ Your code structure follows best... │
└─────────────────────────────────────┘
```

---

## 🤖 How AI Grading Works

### **For URL Submissions:**
1. AI receives the URL
2. Analyzes the instructions and rubric
3. Evaluates based on criteria
4. Generates detailed feedback
5. Assigns score 1-5

### **For Image Submissions:**
1. AI uses GPT-4 Vision
2. Analyzes the visual content
3. Compares to requirements
4. Provides visual feedback
5. Assigns score 1-5

### **Grading Criteria:**

| Score | Meaning |
|-------|---------|
| 5 | Excellent - Exceeds expectations |
| 4 | Good - Meets all requirements |
| 3 | Satisfactory - Meets most requirements |
| 2 | Needs Work - Missing key elements |
| 1 | Incomplete - Needs significant revision |

---

## 🎯 Assignment Types

### **1. Deployment Assignment**
- Student deploys a website
- Submits live URL
- AI checks if it's accessible and well-built

### **2. Code Assignment**
- Student submits GitHub repo URL
- AI analyzes code structure
- Provides code review

### **3. Design Assignment**
- Student uploads design mockup (image)
- AI analyzes visual design
- Feedback on layout, colors, UX

### **4. Hybrid Assignment**
- Both file upload AND URL
- Example: Upload wireframe + submit live site
- AI grades both components

---

## 📊 For Trainers: Manual Override

Trainers can:
- ✅ Review AI grades before releasing
- ✅ Manually adjust scores
- ✅ Add additional feedback
- ✅ Override AI decisions
- ✅ Re-grade if needed

---

## 🔒 Security & Privacy

- ✅ Students can only see their own submissions
- ✅ Files stored securely in Supabase Storage
- ✅ Only trainers/admins can view all submissions
- ✅ AI grading is optional (can disable per assignment)
- ✅ Manual grading always available as fallback

---

## 💰 Cost Considerations

**OpenAI API Costs:**
- GPT-4o: ~$0.005 per grading (text)
- GPT-4 Vision: ~$0.01 per grading (image)
- For 100 students: ~$0.50 - $1.00

**Recommendations:**
- Use GPT-3.5-turbo for lower costs (~$0.001 per grading)
- Set submission limits
- Monitor API usage
- Consider manual grading for complex work

---

## 🚀 Implementation Status

### **Phase 1: Database** ✅
- Tables created
- RLS policies set
- Helper functions ready

### **Phase 2: UI** (In Progress)
- Assignment creation form
- Submission interface
- Grade display
- File upload component

### **Phase 3: AI Integration** (Next)
- OpenAI API connection
- Grading logic
- Feedback generation
- Image analysis

---

## 📝 Next Steps

1. **Run `ADD_ASSIGNMENTS_SYSTEM.sql`** in Supabase
2. **Create Storage Bucket** for file uploads
3. **Add OpenAI API Key** to config.js
4. **Test with a sample assignment**
5. **Have students submit work**
6. **Watch AI grade it automatically!**

---

## 🎓 Educational Benefits

- ✅ **Instant feedback** - Students don't wait days for grades
- ✅ **Consistent grading** - AI applies rubric uniformly
- ✅ **Detailed feedback** - More than just a score
- ✅ **Scalable** - Grade 100+ submissions automatically
- ✅ **Learning focused** - Constructive, encouraging feedback
- ✅ **Time-saving** - Trainers review only, don't grade from scratch

---

**This is a game-changer for online learning!** 🚀

