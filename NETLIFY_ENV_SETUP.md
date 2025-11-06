# 🔐 Netlify Environment Variables Setup

## Add OpenAI API Key to Netlify

### **Step-by-Step Instructions:**

1. **Go to Netlify Dashboard:**
   - Visit https://app.netlify.com
   - Select your **ClassroomNeo** site

2. **Navigate to Environment Variables:**
   - Click **Site configuration** (left sidebar)
   - Click **Environment variables**
   - Or direct link: `https://app.netlify.com/sites/YOUR-SITE-NAME/configuration/env`

3. **Add OpenAI API Key:**
   - Click **"Add a variable"** or **"Add environment variable"**
   - **Key:** `OPENAI_API_KEY`
   - **Value:** `[Your OpenAI API key starting with sk-proj-... or sk-...]`
   - **Scopes:** Select "All environments" (or specific ones)
   - Click **"Add variable"** or **"Create"**

4. **Verify Existing Variables:**
   You should now have these environment variables:
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_ANON_KEY`
   - ✅ `OPENAI_API_KEY` (newly added)

5. **Trigger Rebuild:**
   - Go to **Deploys** tab
   - Click **"Trigger deploy"** → **"Clear cache and deploy site"**
   - OR just push your next commit (auto-deploys)

---

## How It Works

### **Build Process:**
When you push to GitHub, Netlify runs this build command:

```bash
echo "const NETLIFY_OPENAI_KEY = '$OPENAI_API_KEY';" >> env-config.js
```

This creates an `env-config.js` file with your API key.

### **In Code:**
`config.js` reads the environment variable:

```javascript
openai: {
  apiKey: typeof NETLIFY_OPENAI_KEY !== 'undefined' ? NETLIFY_OPENAI_KEY : '',
  enabled: typeof NETLIFY_OPENAI_KEY !== 'undefined' && NETLIFY_OPENAI_KEY !== '',
}
```

### **Security:**
✅ API key NOT in GitHub (safe)  
✅ API key only in Netlify environment (secure)  
✅ API key injected at build time (automatic)  
✅ No secrets committed to version control  

---

## After Adding the Variable

Once you've added the `OPENAI_API_KEY` to Netlify:

1. **I'll commit the secure code** (no API key in files)
2. **Push to GitHub** (will succeed now)
3. **Netlify auto-deploys** (injects API key)
4. **AI grading works!** 🎉

---

## Verifying It Works

After deployment:

1. **Check Browser Console:**
   ```javascript
   // Should see this (not empty):
   console.log(CONFIG.openai.enabled); // true
   console.log(CONFIG.openai.apiKey); // Should show your key
   ```

2. **Test AI Grading:**
   - Go to your pending submission
   - Click "🤖 Request AI Grading Now"
   - Should work without CSP errors

---

## Troubleshooting

### **"API key is empty in browser"**
**Cause:** Environment variable not set or build didn't run

**Solution:**
1. Verify `OPENAI_API_KEY` exists in Netlify env vars
2. Trigger new deploy: **Deploys → Trigger deploy → Clear cache and deploy**
3. Check build logs for `env-config.js` creation

### **"Still getting CSP error"**
**Cause:** Old deployment cached

**Solution:**
1. Hard refresh browser: `Ctrl+Shift+R` or `Cmd+Shift+R`
2. Or logout/login (auto cache clear!)

### **"Build failed"**
**Cause:** Syntax error or missing variable

**Solution:**
1. Check Netlify build logs
2. Verify all 3 variables are set
3. Re-trigger deploy

---

## Quick Reference

### **Netlify Environment Variables:**
| Variable | Value | Purpose |
|----------|-------|---------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | Database connection |
| `SUPABASE_ANON_KEY` | `eyJ...` | Database auth |
| `OPENAI_API_KEY` | `[Your OpenAI key]` | AI grading |

### **After Setting Env Vars:**
```bash
# Commit secure code (no secrets)
git add -A
git commit -m "feat: Use Netlify env vars for OpenAI key"
git push origin main

# Netlify auto-deploys with injected keys
```

---

## Ready?

Once you've added the `OPENAI_API_KEY` to Netlify, let me know and I'll:
1. ✅ Commit the secure version
2. ✅ Push to GitHub (will succeed)
3. ✅ Netlify deploys with AI enabled
4. ✅ Test grading together!

🔐 **Your secrets stay secret!**

