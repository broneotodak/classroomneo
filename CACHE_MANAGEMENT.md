# 🔄 Cache Management System

## Auto-Clear Cache on Login/Logout

Your AI Classroom now automatically clears browser cache when users login or logout, ensuring they always get the latest version of the app.

---

## How It Works

### **1. Version Tracking**
- App version stored in `config.js`: `version: '4.0.0'`
- Cache version stored in `auth.js`: `APP_VERSION = '4.0'`
- User's version stored in `localStorage`

### **2. Automatic Cache Clear Events**

**On Login:**
- ✅ Clears localStorage (except auth tokens)
- ✅ Clears sessionStorage
- ✅ Updates version marker
- ✅ Reloads page with timestamp parameter
- ✅ User gets fresh JavaScript/CSS

**On Logout:**
- ✅ Clears localStorage (except auth tokens)
- ✅ Clears sessionStorage
- ✅ Updates version marker
- ✅ Reloads page to home

**On App Load:**
- ✅ Checks stored version vs current version
- ✅ If mismatch → auto-reload with fresh cache
- ✅ Prevents stale code execution

---

## For Developers

### **Force Global Cache Refresh**

To force ALL users to refresh their cache:

1. **Update version in `config.js`:**
```javascript
app: {
  version: '5.0.0',  // Increment this
  cacheVersion: '5.0', // AND this
}
```

2. **Update version in `auth.js`:**
```javascript
this.APP_VERSION = '5.0'; // Match config.js
```

3. **Commit and deploy:**
```bash
git add -A
git commit -m "Version bump - force cache refresh"
git push
```

4. **Next user action:**
- Any logged-in user will auto-refresh on next page load
- Any user logging in will get fresh cache
- Any user logging out will get fresh cache

---

## Cache Clear Functions

### **`clearCacheAndReload()`**
```javascript
// What it does:
- Removes all localStorage items (except auth)
- Clears entire sessionStorage
- Sets new version marker
- Reloads page with ?v=timestamp parameter
```

### **`checkCacheVersion()`**
```javascript
// What it does:
- Compares localStorage version to APP_VERSION
- Returns true if versions match (cache OK)
- Returns false if mismatch (cache needs refresh)
```

---

## What Gets Cleared

### ✅ Cleared:
- All cached app data in localStorage
- All sessionStorage data
- JavaScript files (via URL parameter)
- CSS files (via URL parameter)
- Old module/class data
- Old user preferences (theme persists via cookie)

### ❌ NOT Cleared:
- Supabase auth tokens (kept in localStorage)
- User session (remains active)
- Cookies
- IndexedDB (not used in this app)

---

## Benefits

1. **No More Stale Code**
   - Users never run old JavaScript
   - Always get latest features/fixes

2. **No Manual Refresh Needed**
   - Automatic on login/logout
   - Seamless user experience

3. **Version Mismatch Protection**
   - Detects version mismatches on load
   - Auto-refreshes before running old code

4. **Developer Control**
   - Simple version number increment
   - Forces refresh for all users

---

## Manual Cache Clear (For Testing)

### **Browser Console:**
```javascript
// Clear cache manually
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

### **Browser DevTools:**
1. Open DevTools (F12)
2. Application → Clear Storage
3. Check "Local storage" and "Session storage"
4. Click "Clear site data"
5. Reload page (Ctrl+Shift+R or Cmd+Shift+R)

---

## Troubleshooting

### **"Manual grading still not showing"**
**Solution:**
1. Check that `app.js` was actually deployed
2. Verify version numbers match in config.js and auth.js
3. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
4. Check browser console for version logs

### **"Cache cleared but still seeing old version"**
**Possible causes:**
- CDN caching (wait 1-2 minutes for Netlify deploy)
- Browser has separate cache for index.html
- Service worker caching (not used in this app, but check)

**Solution:**
```bash
# Verify deployment
netlify status

# Check live site version
curl -I https://classroom.neotodak.com

# Force new deployment
git commit --allow-empty -m "Force redeploy"
git push
```

### **"Version check causing infinite reload"**
**Prevention:**
- We check for `?v=` in URL to prevent loops
- Version is set in localStorage after first reload
- If loop occurs, clear localStorage manually

---

## File Versioning

All static files are versioned in `index.html`:

```html
<!-- Old (cached) -->
<script src="app.js?v=3"></script>

<!-- New (fresh) -->
<script src="app.js?v=4"></script>
```

When you increment `?v=4` → `?v=5`, browsers fetch new files.

---

## Best Practices

### **For Updates:**
1. Make code changes
2. Bump version in config.js and auth.js
3. Update file versions in index.html (?v=5)
4. Commit and push
5. All users auto-refresh on next login

### **For Hotfixes:**
1. Apply critical fix
2. Increment version immediately
3. Deploy ASAP
4. Users get fix on next page load or login

### **For Testing:**
1. Test in incognito/private window
2. Verify version number in console
3. Check that manual grading appears
4. Confirm AI grading works

---

## Cache Clear Logs

Check browser console for these messages:

```
🔄 Version mismatch: 3.0 → 4.0
⚠️ Cache outdated, forcing reload...
🔄 Clearing cache and reloading...
✅ Signed in - clearing cache...
👋 Signing out - clearing cache...
```

---

## Summary

✅ **Auto-clear on login** - Fresh start every session  
✅ **Auto-clear on logout** - Clean exit  
✅ **Version detection** - Catches stale cache on load  
✅ **No user action needed** - Completely automatic  
✅ **Developer controlled** - Single version number update  

**Your users will always run the latest code!** 🚀

