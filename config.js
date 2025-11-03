// ==========================================
// AI Classroom - Configuration
// ==========================================

// IMPORTANT: Replace these with your actual Supabase credentials
// Get them from: https://app.supabase.com/project/_/settings/api

const CONFIG = {
  supabase: {
    url: 'YOUR_SUPABASE_URL_HERE',
    anonKey: 'YOUR_SUPABASE_ANON_KEY_HERE',
  },
  
  // App configuration
  app: {
    name: 'AI Classroom',
    version: '2.0.0',
    environment: 'production', // 'development' or 'production'
  },
  
  // GitHub OAuth will be configured in Supabase dashboard
  // No need to add GitHub credentials here
};

// Validation function
const isConfigured = () => {
  return CONFIG.supabase.url !== 'YOUR_SUPABASE_URL_HERE' && 
         CONFIG.supabase.anonKey !== 'YOUR_SUPABASE_ANON_KEY_HERE';
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, isConfigured };
}

