const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const SUPABASE_URL = 'https://tsuowadcbrztlplzaobf.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzdW93YWRjYnJ6dGxwbHphb2JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE1NjU1NiwiZXhwIjoyMDc3NzMyNTU2fQ.DjfRkhws-OHPzeftExB0woYQI7nbW5gt7B0PaCvUgVA';

async function createTable() {
  console.log('🔧 Creating trainer_requests table and functions...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    db: { schema: 'public' },
    auth: { persistSession: false }
  });

  try {
    // Test connection first
    console.log('🔍 Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('users_profile')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Connection test failed:', testError.message);
      return;
    }

    console.log('✅ Connection successful!\n');

    // Instructions for manual migration
    console.log('═'.repeat(70));
    console.log('📋 MANUAL MIGRATION REQUIRED');
    console.log('═'.repeat(70));
    console.log('\nPlease run the SQL migration manually:');
    console.log('\n1. Go to Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/tsuowadcbrztlplzaobf\n');
    console.log('2. Navigate to: SQL Editor\n');
    console.log('3. Create a new query and paste the contents of:');
    console.log('   sql/create_trainer_requests.sql\n');
    console.log('4. Click "Run" to execute\n');
    console.log('═'.repeat(70));
    console.log('\nAlternatively, I can provide step-by-step SQL commands.');
    console.log('Would you like me to show the SQL in smaller chunks?\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTable();
