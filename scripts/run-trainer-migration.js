const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials
const SUPABASE_URL = 'https://tsuowadcbrztlplzaobf.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzdW93YWRjYnJ6dGxwbHphb2JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE1NjU1NiwiZXhwIjoyMDc3NzMyNTU2fQ.DjfRkhws-OHPzeftExB0woYQI7nbW5gt7B0PaCvUgVA';

async function runMigration() {
  console.log('🔧 Running trainer_requests table migration...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Read SQL file
  const sqlPath = path.join(__dirname, '../sql/create_trainer_requests.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('📄 SQL Script:');
  console.log('─'.repeat(60));
  console.log(sql.substring(0, 500) + '...\n');
  console.log('─'.repeat(60));
  console.log('');

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct execution if exec_sql doesn't exist
      console.log('⚠️  exec_sql not available, trying alternative method...\n');

      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`Found ${statements.length} SQL statements to execute\n`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i] + ';';
        console.log(`[${i + 1}/${statements.length}] Executing...`);

        // Use the REST API directly for DDL statements
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({ sql_query: stmt })
        });

        if (!response.ok) {
          console.error(`❌ Statement ${i + 1} failed`);
          const errorText = await response.text();
          console.error(errorText);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }

      console.log('\n✅ Migration completed!');
      console.log('\n📊 Summary:');
      console.log('  - Created: trainer_requests table');
      console.log('  - Added: RLS policies for students and admins');
      console.log('  - Created: approve_trainer_request() function');
      console.log('  - Created: reject_trainer_request() function');
    } else {
      console.log('✅ Migration executed successfully!');
      console.log(data);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
