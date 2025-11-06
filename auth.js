// ==========================================
// AI Classroom - Authentication Module
// ==========================================

class AuthManager {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.currentUser = null;
    this.sessionCheckInterval = null;
    this.APP_VERSION = '4.0'; // Increment this to force cache clear
  }

  // Clear browser cache and reload
  clearCacheAndReload() {
    console.log('🔄 Clearing cache and reloading...');
    
    // Clear localStorage cache markers
    const keysToKeep = ['supabase.auth.token']; // Keep auth token
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Set cache version
    localStorage.setItem('app_version', this.APP_VERSION);
    
    // Force reload with cache bust
    const timestamp = new Date().getTime();
    window.location.href = `${window.location.origin}${window.location.pathname}?v=${timestamp}${window.location.hash}`;
  }

  // Check if cache needs refresh
  checkCacheVersion() {
    const storedVersion = localStorage.getItem('app_version');
    
    if (!storedVersion || storedVersion !== this.APP_VERSION) {
      console.log(`🔄 Version mismatch: ${storedVersion} → ${this.APP_VERSION}`);
      localStorage.setItem('app_version', this.APP_VERSION);
      return false; // Needs refresh
    }
    
    return true; // Up to date
  }

  // Initialize auth state
  async initialize() {
    try {
      // Check cache version on app load
      if (!this.checkCacheVersion() && !window.location.search.includes('v=')) {
        console.log('⚠️ Cache outdated, forcing reload...');
        this.clearCacheAndReload();
        return null;
      }

      // Get current session
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session) {
        this.currentUser = session.user;
        await this.updateLastLogin();
        this.onAuthStateChange(true);
        
        // Redirect to dashboard if on home page
        setTimeout(() => {
          if (window.location.hash === '' || window.location.hash === '#home' || window.location.hash === '#') {
            window.location.hash = '#dashboard';
          }
        }, 100);
      }

      // Listen for auth changes
      this.supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        
        if (session) {
          this.currentUser = session.user;
          this.onAuthStateChange(true);
          
          if (event === 'SIGNED_IN') {
            this.updateLastLogin();
            // Clear cache and redirect to dashboard on sign in
            console.log('✅ Signed in - clearing cache...');
            setTimeout(() => {
              this.clearCacheAndReload();
            }, 100);
          }
        } else {
          this.currentUser = null;
          this.onAuthStateChange(false);
        }
      });

      return this.currentUser;
    } catch (error) {
      console.error('Error initializing auth:', error);
      return null;
    }
  }

  // Sign in with GitHub
  async signInWithGitHub() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error signing in with GitHub:', error);
      throw error;
    }
  }

  // Sign out
  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      
      this.currentUser = null;
      
      // Clear cache on logout
      console.log('👋 Signing out - clearing cache...');
      this.clearCacheAndReload();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Update last login timestamp
  async updateLastLogin() {
    if (!this.currentUser) return;

    try {
      await this.supabase
        .from('users_profile')
        .update({ last_login: new Date().toISOString() })
        .eq('id', this.currentUser.id);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Get current user profile
  async getUserProfile() {
    if (!this.currentUser) return null;

    try {
      const { data, error } = await this.supabase
        .from('users_profile')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Auth state change callback (override in app)
  onAuthStateChange(isAuthenticated) {
    // This will be overridden by the app
    console.log('Auth state:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
  }

  // Require authentication (redirect if not authenticated)
  requireAuth() {
    if (!this.isAuthenticated()) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/?login=required&return=${returnUrl}`;
      return false;
    }
    return true;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthManager;
}

