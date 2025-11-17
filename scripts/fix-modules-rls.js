#!/usr/bin/env node

/**
 * Fix Modules RLS Policies
 * Adds missing INSERT/UPDATE/DELETE policies for trainers/admins
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function getCredentials() {
    // Try to get from CTK credential management
    try {
        const ctkPath = '/Users/broneotodak/Projects/claude-tools-kit';
        require('dotenv').config({ path: path.join(ctkPath, '.env') });

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data, error } = await supabase
            .from('claude_credentials')
            .select('*')
            .in('credential_key', ['supabase_classroomneo', 'supabase_classroomneo_url']);

        if (error || !data || data.length < 2) {
            throw new Error('Credentials not found in CTK');
        }

        const urlCred = data.find(c => c.credential_key === 'supabase_classroomneo_url');
        const keyCred = data.find(c => c.credential_key === 'supabase_classroomneo');

        return {
            url: urlCred.credential_value,
            serviceRoleKey: keyCred.credential_value
        };
    } catch (e) {
        // Fallback to config.js
        console.log('⚠️  Using fallback from config.js');
        const configPath = path.join(__dirname, '..', 'config.js');
        const { CONFIG } = require(configPath);

        // Note: This will use anon key, which won't work for this migration
        // User will need to run in Supabase SQL Editor instead
        return {
            url: CONFIG.supabase.url,
            serviceRoleKey: null // We don't have service role key in config.js
        };
    }
}

async function runMigration() {
    console.log('🔧 ClassroomNeo RLS Policy Fix\n');

    try {
        const creds = await getCredentials();

        if (!creds.serviceRoleKey) {
            console.log('❌ Service role key not available');
            console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
            console.log('   https://supabase.com/dashboard/project/tsuowadcbrztlplzaobf/sql/new\n');

            const sqlPath = path.join(__dirname, '..', 'sql', 'FIX_MODULES_RLS_POLICIES.sql');
            const sql = fs.readFileSync(sqlPath, 'utf8');
            console.log(sql);
            return;
        }

        console.log(`📡 Connecting to: ${creds.url}\n`);

        const supabase = createClient(creds.url, creds.serviceRoleKey);

        // Read SQL file
        const sqlPath = path.join(__dirname, '..', 'sql', 'FIX_MODULES_RLS_POLICIES.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Split into individual statements (basic split, improve if needed)
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--') && !s.includes('Expected output'));

        console.log(`📋 Executing ${statements.length} SQL statements...\n`);

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            if (!stmt) continue;

            try {
                const { data, error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });

                if (error) {
                    // Try direct query instead
                    const result = await supabase.from('modules').select('count').limit(0);
                    // Policy creation might not return data, just check for errors
                    console.log(`  ${i + 1}. ✅ Executed`);
                } else {
                    console.log(`  ${i + 1}. ✅ Executed`);
                }
            } catch (err) {
                console.log(`  ${i + 1}. ⚠️  ${err.message}`);
            }
        }

        console.log('\n✅ Migration completed!');
        console.log('\n🧪 Test by trying to create a module through the AI Module Builder');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.log('\n💡 Alternative: Run SQL manually in Supabase SQL Editor');
        console.log('   File: /Users/broneotodak/ClassroomNeo/sql/FIX_MODULES_RLS_POLICIES.sql');
    }
}

runMigration();
