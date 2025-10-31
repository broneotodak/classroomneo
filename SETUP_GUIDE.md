# 📘 Complete Setup Guide - AI Classroom Project

This guide will walk you through every step of setting up and deploying your AI Classroom project from scratch.

## 📚 Table of Contents

1. [Initial Setup with Cursor](#1-initial-setup-with-cursor)
2. [Setting Up GitHub](#2-setting-up-github)
3. [Deploying to Netlify](#3-deploying-to-netlify)
4. [Configuring Supabase](#4-configuring-supabase)
5. [Testing Everything](#5-testing-everything)

---

## 1. Initial Setup with Cursor

### Step 1.1: Download and Install Cursor

1. Visit [https://cursor.sh](https://cursor.sh)
2. Click "Download" for your operating system
3. Install the application
4. Launch Cursor

### Step 1.2: Open Your Project

1. In Cursor, click **File** → **Open Folder**
2. Navigate to your `ClassroomNeo` folder
3. Click **Select Folder**

### Step 1.3: Explore the Files

You should see:
- `index.html` - Your main website
- `styles.css` - All the styling
- `script.js` - JavaScript functionality
- `README.md` - Project documentation

### Step 1.4: Test Locally

1. Right-click on `index.html`
2. Select "Open with Live Server" (if you have the extension)
3. Or simply double-click `index.html` to open in your browser

---

## 2. Setting Up GitHub

### Step 2.1: Create a GitHub Account

1. Go to [https://github.com](https://github.com)
2. Click "Sign up"
3. Follow the registration process
4. Verify your email

### Step 2.2: Install Git

**For macOS:**
```bash
# Git is usually pre-installed. Check with:
git --version

# If not installed, install with Homebrew:
brew install git
```

**For Windows:**
1. Download from [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Run the installer
3. Use default settings

**For Linux:**
```bash
sudo apt-get install git  # Debian/Ubuntu
sudo yum install git       # CentOS/Fedora
```

### Step 2.3: Configure Git

Open Cursor's terminal (View → Terminal) and run:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 2.4: Initialize Git Repository

In the terminal:

```bash
# Make sure you're in the ClassroomNeo directory
cd /path/to/ClassroomNeo

# Initialize Git
git init

# Add all files
git add .

# Make your first commit
git commit -m "Initial commit: AI Classroom tutorial site"
```

### Step 2.5: Create GitHub Repository

1. Go to [https://github.com/new](https://github.com/new)
2. Repository name: `ClassroomNeo` (or your preferred name)
3. Description: "AI Classroom - Full Stack Development Tutorial"
4. Choose "Public" (so it can be deployed on Netlify free tier)
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### Step 2.6: Push to GitHub

Copy the commands from GitHub (they'll look like this):

```bash
git remote add origin https://github.com/YOUR-USERNAME/ClassroomNeo.git
git branch -M main
git push -u origin main
```

### Step 2.7: Verify Upload

1. Refresh your GitHub repository page
2. You should see all your files!

---

## 3. Deploying to Netlify

### Step 3.1: Create Netlify Account

1. Go to [https://netlify.com](https://netlify.com)
2. Click "Sign up"
3. Choose "Sign up with GitHub" (recommended)
4. Authorize Netlify to access your GitHub

### Step 3.2: Create New Site

1. Click "Add new site" → "Import an existing project"
2. Select "GitHub"
3. Find and click on your `ClassroomNeo` repository
4. If you don't see it, click "Configure the Netlify app on GitHub" to grant access

### Step 3.3: Configure Build Settings

On the deploy settings page:

- **Branch to deploy:** `main`
- **Build command:** (leave empty)
- **Publish directory:** `.` (just a dot, meaning root directory)

Click "Deploy site"

### Step 3.4: Wait for Deployment

- Watch the deploy log
- Usually takes 30-60 seconds
- You'll see a success message when done

### Step 3.5: Visit Your Live Site!

1. Click on the generated URL (something like `https://random-name-123.netlify.app`)
2. Your site is now live! 🎉

### Step 3.6: Customize Your Domain (Optional)

1. Go to "Site settings" → "Domain management"
2. Click "Options" → "Edit site name"
3. Choose a custom subdomain: `your-classroom.netlify.app`
4. Or add your own custom domain

---

## 4. Configuring Supabase

### Step 4.1: Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended)

### Step 4.2: Create New Project

1. Click "New project"
2. Choose your organization (create one if needed)
3. Fill in:
   - **Name:** ClassroomNeo
   - **Database Password:** (generate a strong one and save it!)
   - **Region:** Choose closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### Step 4.3: Create Messages Table

1. In your Supabase dashboard, click "SQL Editor" in the sidebar
2. Click "New query"
3. Paste this SQL:

```sql
-- Create messages table
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL CHECK (char_length(content) <= 200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read messages
CREATE POLICY "Allow public read access" 
ON messages FOR SELECT 
USING (true);

-- Allow anyone to insert messages
CREATE POLICY "Allow public insert access" 
ON messages FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX messages_created_at_idx ON messages(created_at DESC);
```

4. Click "Run" (or press Ctrl/Cmd + Enter)
5. You should see "Success. No rows returned"

### Step 4.4: Get Your API Credentials

1. Click "Settings" (gear icon) in the sidebar
2. Click "API" under Project Settings
3. You'll see:
   - **Project URL**
   - **API Keys**
     - `anon` `public` key (this is safe to use in your frontend)
     - `service_role` key (keep this SECRET!)

### Step 4.5: Add Credentials to Your Project

1. Open `script.js` in Cursor
2. Find these lines at the top:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';
```

3. Replace with your actual credentials:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### Step 4.6: Test Locally

1. Open `index.html` in your browser
2. Scroll to the Demo section
3. Try sending a message
4. It should appear in the messages list!

### Step 4.7: Push Changes to GitHub

```bash
git add script.js
git commit -m "Add Supabase credentials"
git push
```

### Step 4.8: Netlify Auto-Deploy

- Netlify automatically detects the push
- It will rebuild and deploy your site
- Wait 1-2 minutes and check your live site
- The demo should now work!

---

## 5. Testing Everything

### Test Checklist

- [ ] **Navigation:** Click all navigation links - they should smoothly scroll
- [ ] **Cursor Tutorial:** Read through the Cursor setup instructions
- [ ] **GitHub Tutorial:** Verify GitHub setup steps are clear
- [ ] **Netlify Tutorial:** Check deployment instructions
- [ ] **Supabase Tutorial:** Review database setup guide
- [ ] **Demo - Send Message:** Type a message and click "Send Message"
- [ ] **Demo - View Messages:** Messages should appear in the list
- [ ] **Demo - Refresh:** Click "Refresh" to reload messages
- [ ] **Demo - Real-time:** Open two browser windows and send messages
- [ ] **Mobile Responsive:** View on phone/tablet
- [ ] **All Links:** Test all external links open correctly

### Troubleshooting Common Issues

#### "Supabase not configured" Error
- Double-check your URL and API key in `script.js`
- Make sure there are no quotes or extra spaces
- Verify you saved the file and pushed to GitHub

#### Messages Not Showing
- Check browser console (F12) for errors
- Verify the table name is exactly `messages`
- Check that RLS policies are created
- Try refreshing the page

#### Netlify Deploy Failed
- Check the deploy log for specific errors
- Make sure all files are committed to Git
- Verify file paths are correct (case-sensitive!)

#### Real-time Not Working
- This is normal - real-time requires page refresh
- To enable live updates, check Supabase real-time subscriptions

---

## 🎓 You're Done!

Congratulations! You now have:

- ✅ A beautiful tutorial website
- ✅ Code hosted on GitHub
- ✅ Live site on Netlify
- ✅ Working database with Supabase
- ✅ Real-time features

### Next Steps

1. **Customize the content** - Add your own examples
2. **Add features** - Try authentication, file uploads
3. **Share with students** - Send them the Netlify URL
4. **Keep learning** - Explore advanced Supabase features

### Resources

- [Cursor Documentation](https://cursor.sh/docs)
- [GitHub Guides](https://guides.github.com)
- [Netlify Docs](https://docs.netlify.com)
- [Supabase Docs](https://supabase.com/docs)

---

## 🆘 Need Help?

- Check the browser console (F12) for errors
- Review Supabase logs in the dashboard
- Check Netlify deploy logs
- Refer to the main README.md file

Happy teaching! 🚀

