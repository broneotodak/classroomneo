// ==========================================
// Environment Configuration Loader
// ==========================================
// This file loads configuration from Netlify environment variables
// if they exist, otherwise uses values from config.js

(function() {
  // Check if running in Netlify (environment variables will be injected)
  // Netlify injects env vars during build, we'll check for them at runtime
  
  // For Netlify: Environment variables need to be injected via _redirects or netlify.toml
  // For local development: This file does nothing, config.js will use its own values
  
  // We'll set these as global variables that config.js can check
  if (typeof window !== 'undefined') {
    // These will be undefined unless injected by Netlify
    window.NETLIFY_SUPABASE_URL = typeof NETLIFY_SUPABASE_URL !== 'undefined' ? NETLIFY_SUPABASE_URL : null;
    window.NETLIFY_SUPABASE_ANON_KEY = typeof NETLIFY_SUPABASE_ANON_KEY !== 'undefined' ? NETLIFY_SUPABASE_ANON_KEY : null;
  }
})();

