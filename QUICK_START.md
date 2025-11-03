# ⚡ Quick Start Guide - AI Classroom v2.0

Get your AI Classroom up and running in **5 minutes**!

## 🎯 What You Need

- [ ] GitHub account
- [ ] Supabase account (free)
- [ ] 5 minutes of your time

## 📝 Step-by-Step

### 1️⃣ Create Supabase Project (2 min)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New project"**
3. Name: `AI-Classroom`
4. Generate & save database password
5. Choose nearest region
6. Click **"Create new project"**

### 2️⃣ Set Up Database (1 min)

1. Click **"SQL Editor"** in sidebar
2. Click **"New query"**
3. Copy **entire content** of `SUPABASE_SETUP.sql`
4. Paste and click **"Run"**
5. ✅ Should see "Success. No rows returned"

### 3️⃣ Enable GitHub Auth (2 min)

1. Go to **"Authentication"** → **"Providers"**
2. Enable **"GitHub"**
3. Copy the **Callback URL** (save for later)
4. Open new tab: [github.com/settings/developers](https://github.com/settings/developers)
5. Click **"OAuth Apps"** → **"New OAuth App"**
6. Fill in:
   - **Name**: AI Classroom
   - **Homepage**: `http://localhost:8000`
   - **Callback**: Paste Supabase callback URL
7. Click **"Register application"**
8. Copy **Client ID** and generate **Client Secret**
9. Go back to Supabase, paste both values
10. Click **"Save"**

### 4️⃣ Configure App (1 min)

1. Open `config.js` in your project
2. In Supabase: **Settings** → **API**
3. Copy **Project URL** and **anon public** key
4. Paste into `config.js`:

```javascript
const CONFIG = {
  supabase: {
    url: 'YOUR_PROJECT_URL',
    anonKey: 'YOUR_ANON_KEY',
  },
  // ...
};
```

### 5️⃣ Test It! (30 sec)

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` and click **"Sign in with GitHub"**

## ✅ Done!

You should now be able to:
- ✅ Sign in with GitHub
- ✅ See your personalized dashboard
- ✅ Start learning modules
- ✅ Track your progress

## 🚀 Deploy to Production

### Quick Deploy to Netlify (2 min)

1. Push to GitHub:
   ```bash
   git add .
   git commit -m "Configure AI Classroom"
   git push
   ```

2. Go to [netlify.com](https://netlify.com) → **"Add new site"**
3. Connect your GitHub repo
4. Deploy!

5. Update GitHub OAuth:
   - Add Netlify URL to GitHub OAuth app
   - Homepage: `https://your-site.netlify.app`

## 📚 Next Steps

- Read [AUTH_SETUP.md](AUTH_SETUP.md) for detailed configuration
- Read [README.md](README.md) for complete documentation
- Customize modules and steps in Supabase
- Share with your students!

## 🐛 Something Not Working?

### Can't sign in?
→ Check GitHub OAuth callback URL matches exactly

### Database errors?
→ Re-run `SUPABASE_SETUP.sql` script

### "Supabase not configured"?
→ Check credentials in `config.js`

### Progress not saving?
→ Make sure you're signed in and check browser console

## 💬 Need Help?

Check the full setup guide: [AUTH_SETUP.md](AUTH_SETUP.md)

---

**Total Time**: ~5 minutes ⏱️

Happy teaching! 🎓

