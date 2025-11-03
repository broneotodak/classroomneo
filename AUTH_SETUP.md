## 🔐 AI Classroom - Authentication Setup Guide

This guide will walk you through setting up GitHub OAuth authentication and Supabase for the AI Classroom project.

## 📋 Prerequisites

- A Supabase account ([sign up here](https://supabase.com))
- A GitHub account ([sign up here](https://github.com))
- Your ClassroomNeo project files

## 🚀 Part 1: Supabase Project Setup

### Step 1: Create a New Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New project"**
3. Fill in the details:
   - **Name**: `AI-Classroom` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the closest to your users
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be provisioned

### Step 2: Run the Database Schema

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the `SUPABASE_SETUP.sql` file from your project
4. Copy the entire content and paste it into the SQL Editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)
6. You should see: ✅ **"Success. No rows returned"**

This creates:
- User profiles table
- Modules and steps tables
- User progress tracking
- Messages table for community board
- All necessary Row Level Security (RLS) policies

### Step 3: Enable GitHub Authentication

1. In your Supabase dashboard, go to **"Authentication"** → **"Providers"**
2. Find **"GitHub"** in the list
3. Toggle it to **"Enabled"**
4. You'll see two fields:
   - **Client ID** (leave empty for now)
   - **Client Secret** (leave empty for now)
5. Copy the **"Callback URL (for OAuth)"** - it should look like:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
6. Keep this tab open - we'll come back to it

## 🐙 Part 2: GitHub OAuth App Setup

### Step 1: Create a GitHub OAuth App

1. Go to [https://github.com/settings/developers](https://github.com/settings/developers)
2. Click **"OAuth Apps"** in the left sidebar
3. Click **"New OAuth App"**
4. Fill in the application details:
   - **Application name**: `AI Classroom` (or your preferred name)
   - **Homepage URL**: `http://localhost:8000` (for local development) or your production URL
   - **Application description**: `Full stack development tutorial platform`
   - **Authorization callback URL**: Paste the Supabase callback URL you copied earlier
5. Click **"Register application"**

### Step 2: Get Your GitHub Credentials

1. After creating the app, you'll see your **Client ID** - copy it
2. Click **"Generate a new client secret"**
3. Copy the **Client Secret** immediately (you won't be able to see it again!)

### Step 3: Add Credentials to Supabase

1. Go back to your Supabase dashboard
2. Go to **"Authentication"** → **"Providers"** → **"GitHub"**
3. Paste your **Client ID**
4. Paste your **Client Secret**
5. Click **"Save"**

✅ GitHub authentication is now configured!

## 🔑 Part 3: Configure Your Application

### Step 1: Get Your Supabase Credentials

1. In your Supabase dashboard, click the **"Settings"** icon (gear) in the sidebar
2. Click **"API"** under Project Settings
3. You'll see:
   - **Project URL** (something like `https://xxx.supabase.co`)
   - **API Keys**:
     - `anon` `public` key (safe to use in your frontend)
     - `service_role` key (⚠️ KEEP THIS SECRET!)

### Step 2: Update config.js

1. Open `config.js` in your project
2. Replace the placeholder values:

```javascript
const CONFIG = {
  supabase: {
    url: 'https://your-project.supabase.co',  // Your Project URL
    anonKey: 'eyJhbGci...your-anon-key',      // Your anon public key
  },
  
  app: {
    name: 'AI Classroom',
    version: '2.0.0',
    environment: 'production',
  },
};
```

3. Save the file

### Step 3: Update GitHub OAuth for Production (Optional)

When you deploy to Netlify:

1. Go back to your GitHub OAuth App settings
2. Click **"Update application"**
3. Change **Homepage URL** to your Netlify URL (e.g., `https://your-site.netlify.app`)
4. You can add multiple **Authorization callback URLs**:
   ```
   http://localhost:8000
   https://your-project.supabase.co/auth/v1/callback
   https://your-site.netlify.app
   ```

## 🧪 Part 4: Test Your Setup

### Step 1: Test Locally

1. Start a local server:
   ```bash
   cd /path/to/ClassroomNeo
   python3 -m http.server 8000
   ```

2. Open `http://localhost:8000` in your browser

3. Click **"Sign in with GitHub"**

4. You should be redirected to GitHub to authorize the app

5. After authorization, you should be logged in!

### Step 2: Verify Database

1. Go to Supabase dashboard → **"Table Editor"**
2. Click on the **"users_profile"** table
3. You should see your profile with GitHub information!

### Step 3: Test Progress Tracking

1. Navigate to the Dashboard
2. Click **"Start"** on a module
3. Complete a step
4. Go to Supabase → **"user_progress"** table
5. You should see your progress recorded!

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Use the `anon` key in your frontend code
- ✅ Enable Row Level Security (RLS) on all tables
- ✅ Test your RLS policies thoroughly
- ✅ Use environment variables for production
- ✅ Keep your `service_role` key secret

### ❌ DON'T:
- ❌ Commit secrets to Git
- ❌ Use the `service_role` key in frontend code
- ❌ Disable RLS on tables with user data
- ❌ Allow public access to sensitive data

## 🌐 Part 5: Deploy to Netlify

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add authentication system with GitHub OAuth"
git push origin main
```

### Step 2: Deploy on Netlify

1. Go to [https://netlify.com](https://netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** and choose your repository
4. Configure:
   - **Build command**: (leave empty)
   - **Publish directory**: `.`
5. Click **"Deploy site"**

### Step 3: Update GitHub OAuth Callback

1. Copy your Netlify URL (e.g., `https://your-site.netlify.app`)
2. Go to GitHub OAuth App settings
3. Update the **Homepage URL**
4. The callback URL in Supabase should already work!

## 🎉 You're Done!

Your AI Classroom is now fully functional with:
- ✅ GitHub OAuth authentication
- ✅ User profile management
- ✅ Progress tracking
- ✅ Community message board
- ✅ Secure database with RLS

## 🐛 Troubleshooting

### Issue: "Invalid login credentials"

**Solution**: 
- Check that your Supabase URL and anon key are correct in `config.js`
- Verify GitHub OAuth app is properly configured

### Issue: "redirect_uri_mismatch"

**Solution**:
- Make sure the callback URL in GitHub OAuth app matches your Supabase callback URL exactly
- Check for trailing slashes

### Issue: Can't see user profile in database

**Solution**:
- Check that the `handle_new_user()` trigger is created in Supabase
- Re-run the `SUPABASE_SETUP.sql` script

### Issue: Progress not saving

**Solution**:
- Check browser console for errors
- Verify RLS policies are created
- Make sure you're signed in

### Issue: "Table does not exist"

**Solution**:
- Re-run the `SUPABASE_SETUP.sql` script in the SQL Editor
- Make sure you selected the correct project in Supabase

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 💬 Need Help?

If you encounter issues:
1. Check the browser console for errors (F12)
2. Check Supabase logs in the dashboard
3. Verify all credentials are correct
4. Make sure RLS policies are properly configured

Happy teaching! 🚀

