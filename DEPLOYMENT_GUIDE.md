# 🚀 Deployment Guide - Fixing "Please configure your Supabase credentials"

You're seeing this error because your Supabase credentials need to be added. Here's how to fix it:

## ⚡ Quick Fix (2 minutes)

### Step 1: Get Your Supabase Credentials

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **If you haven't created a project yet:**
   - Click "New project"
   - Name: `AI-Classroom`
   - Set a strong database password (save it!)
   - Choose your region
   - Click "Create new project" (wait 2-3 minutes)
   
3. **Get your credentials:**
   - Click **Settings** (gear icon) → **API**
   - Copy these two values:
     - ✅ **Project URL** (looks like `https://xxxxx.supabase.co`)
     - ✅ **anon public** key (long JWT token starting with `eyJ...`)

### Step 2: Set Up Database

Before adding credentials, set up your database:

1. In Supabase, click **SQL Editor**
2. Click **New query**
3. Open `SUPABASE_SETUP.sql` from your project
4. Copy the entire content and paste it
5. Click **Run** (or Cmd/Ctrl + Enter)
6. ✅ You should see "Success. No rows returned"

### Step 3: Update config.js

**Option A: Directly in the file (Easier)**

1. Open `config.js` in your project
2. Replace the placeholder values:

```javascript
const CONFIG = {
  supabase: {
    url: 'https://your-project.supabase.co',  // ← Paste your Project URL
    anonKey: 'eyJhbGci...your-key-here',      // ← Paste your anon public key
  },
  // ... rest stays the same
};
```

3. Save the file
4. Commit and push:
```bash
git add config.js
git commit -m "Add Supabase credentials"
git push origin main
```

5. Netlify will auto-deploy (wait 1-2 minutes)
6. ✅ Refresh your site - it should work!

**Option B: Use Netlify Environment Variables (More Secure)**

This keeps credentials out of your code:

1. Go to your Netlify dashboard
2. Click on your `classroomneo` site
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable** and add:
   - Key: `SUPABASE_URL`
   - Value: Your Project URL
   - Scopes: Select all
   
5. Click **Add a variable** again:
   - Key: `SUPABASE_ANON_KEY`
   - Value: Your anon public key
   - Scopes: Select all

6. Go to **Deploys** → **Trigger deploy** → **Clear cache and deploy**

7. Wait for deployment to complete

8. You'll need to update your code to read from environment variables (I can help with this if you choose this option)

---

## 🔐 Enable GitHub Authentication (Required)

After your site works, enable GitHub OAuth:

### Step 1: Enable GitHub in Supabase

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **GitHub** and toggle it on
3. Copy the **Callback URL** (looks like `https://xxxxx.supabase.co/auth/v1/callback`)
4. Keep this tab open

### Step 2: Create GitHub OAuth App

1. Go to [https://github.com/settings/developers](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name**: `AI Classroom`
   - **Homepage URL**: `https://classroomneo.netlify.app` (your Netlify URL)
   - **Application description**: `Full stack development tutorial`
   - **Authorization callback URL**: Paste the Supabase callback URL from Step 1
4. Click **Register application**

### Step 3: Connect GitHub to Supabase

1. After creating the app, copy your **Client ID**
2. Click **Generate a new client secret**
3. Copy the **Client Secret** (you can't see it again!)
4. Go back to Supabase **Authentication** → **Providers** → **GitHub**
5. Paste **Client ID** and **Client Secret**
6. Click **Save**

### Step 4: Test Authentication

1. Visit your Netlify site: `https://classroomneo.netlify.app`
2. Click **"Sign in with GitHub"**
3. Authorize the app
4. ✅ You should be signed in!

---

## 🧪 Testing Locally

To test with your credentials locally:

1. Update `config.js` with your credentials (as shown above)
2. Run a local server:
```bash
python3 -m http.server 8000
```
3. Visit `http://localhost:8000`
4. Everything should work!

---

## ⚠️ Important Security Notes

### ✅ DO:
- Use the **anon public** key in your frontend
- Keep the **service_role** key secret (never commit it!)
- Set up Row Level Security (done by SUPABASE_SETUP.sql)

### ❌ DON'T:
- Commit sensitive keys to public repositories
- Use the service_role key in frontend code
- Disable Row Level Security

---

## 🐛 Troubleshooting

### Still seeing "Please configure"?
- Double-check the credentials in `config.js`
- Make sure there are no extra spaces or quotes
- Verify you committed and pushed the changes
- Wait for Netlify to redeploy (check deploy status)

### "Invalid API key" error?
- Make sure you copied the **anon public** key, not service_role
- Check that the key starts with `eyJ`

### Can't sign in with GitHub?
- Verify GitHub OAuth callback URL matches Supabase exactly
- Check that GitHub provider is enabled in Supabase
- Make sure you're using your actual Netlify URL

### Database errors?
- Verify you ran `SUPABASE_SETUP.sql`
- Check that all tables were created in Supabase Table Editor
- Make sure Row Level Security is enabled

---

## 📞 Need More Help?

1. Read `QUICK_START.md` for a 5-minute setup
2. Read `AUTH_SETUP.md` for detailed instructions
3. Check the browser console (F12) for specific errors
4. Verify everything in Supabase dashboard

---

## ✅ Checklist

Before your site works, you need:

- [ ] Supabase project created
- [ ] Database schema set up (`SUPABASE_SETUP.sql` run)
- [ ] Credentials added to `config.js`
- [ ] Changes committed and pushed to GitHub
- [ ] Netlify redeployed
- [ ] GitHub OAuth app created
- [ ] GitHub connected to Supabase
- [ ] Test sign-in works

Once all are checked, your AI Classroom will be fully functional! 🎉

---

**Quick Summary:**
1. Get Supabase credentials → 2. Update `config.js` → 3. Push to GitHub → 4. Wait for Netlify deploy → 5. Set up GitHub OAuth → 6. Test!

