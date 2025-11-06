// ==========================================
// AI Classroom - Authentication Module
// ==========================================

class AuthManager {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.currentUser = null;
    this.sessionCheckInterval = null;
  }

  // Initialize auth state
  async initialize() {
    try {
      // Get current session
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session) {
        this.currentUser = session.user;
        await this.updateLastLogin();
        this.onAuthStateChange(true);
      }

      // Listen for auth changes
      this.supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        
        if (session) {
          this.currentUser = session.user;
          this.onAuthStateChange(true);
          
          if (event === 'SIGNED_IN') {
            this.updateLastLogin();
            // Redirect to dashboard on sign in
            if (window.location.hash === '' || window.location.hash === '#home') {
              window.location.hash = '#dashboard';
            }
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
      window.location.href = '/';
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

