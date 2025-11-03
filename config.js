// ==========================================
// AI Classroom - Configuration
// ==========================================

// This configuration supports both:
// 1. Netlify environment variables (recommended for production)
// 2. Direct configuration (for local development)

const CONFIG = {
  supabase: {
    // Priority: Netlify env vars > Direct configuration
    url: (typeof window !== 'undefined' && window.NETLIFY_SUPABASE_URL) 
      ? window.NETLIFY_SUPABASE_URL 
      : 'YOUR_SUPABASE_URL_HERE',
    
    anonKey: (typeof window !== 'undefined' && window.NETLIFY_SUPABASE_ANON_KEY) 
      ? window.NETLIFY_SUPABASE_ANON_KEY 
      : 'YOUR_SUPABASE_ANON_KEY_HERE',
  },
  
  // App configuration
  app: {
    name: 'AI Classroom',
    version: '2.0.0',
    environment: 'production',
  },
};

// Validation function
const isConfigured = () => {
  const url = CONFIG.supabase.url;
  const key = CONFIG.supabase.anonKey;
  
  return url && url !== 'YOUR_SUPABASE_URL_HERE' && 
         key && key !== 'YOUR_SUPABASE_ANON_KEY_HERE' &&
         url.includes('supabase.co');
};

// Debug info (only in development)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🔧 Configuration status:', {
    configured: isConfigured(),
    usingNetlifyVars: !!(window.NETLIFY_SUPABASE_URL),
    url: CONFIG.supabase.url.substring(0, 30) + '...',
  });
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, isConfigured };
}
