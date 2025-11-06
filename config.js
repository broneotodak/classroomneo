// ==========================================
// AI Classroom - Configuration
// ==========================================

// IMPORTANT: Add your Supabase credentials here OR set them as Netlify environment variables
// Get them from: https://app.supabase.com/project/_/settings/api

// For Netlify: Set SUPABASE_URL and SUPABASE_ANON_KEY as environment variables in Netlify dashboard
// For local dev: Replace the values below with your actual credentials

const CONFIG = {
  supabase: {
    // The app will use environment variables from Netlify if available
    url: 'https://tsuowadcbrztlplzaobf.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzdW93YWRjYnJ6dGxwbHphb2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNTY1NTYsImV4cCI6MjA3NzczMjU1Nn0.OCxKgkzcGWVkHQFnVA-P_COagpuqkUlFtjfpzoqYkEY',
  },
  
  // OpenAI configuration (for AI grading and module generation)
  // Note: For security, add your OpenAI API key directly here for local dev,
  // or use Netlify Functions (see serverless approach in docs)
  openai: {
    apiKey: '', // Leave empty - will use serverless function for production
    enabled: false, // Set to true when using local API key for development
    useServerless: true, // Use Netlify Functions for secure API calls
  },
  
  // App configuration
  app: {
    name: 'AI Classroom',
    version: '4.0.0',
    environment: 'production',
    cacheVersion: '4.0', // Increment to force all users to refresh cache
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

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, isConfigured };
}
