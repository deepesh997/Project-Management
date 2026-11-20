import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPgPool, testConnection } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('[WorkSphere DB] Connecting to Supabase PostgreSQL cluster...');
  const check = await testConnection();
  if (!check.connected) {
    console.error(`\n[ERROR] Could not connect to Supabase: ${check.message}`);
    console.error('Please make sure you have added your Supabase password into .env:');
    console.error('  DB_PASSWORD=your_actual_password\n');
    process.exit(1);
  }

  console.log(`[WorkSphere DB] Connected to database "${check.database}" successfully.`);
  console.log(`[WorkSphere DB] Server version: ${check.version.split(' ')[0]}`);

  const pool = createPgPool();
  const schemaPath = path.join(__dirname, 'schema.sql');
  const ddl = fs.readFileSync(schemaPath, 'utf-8');

  console.log('[WorkSphere DB] Executing DDL migrations (12 normalized tables, indexes, constraints)...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    await client.query(ddl);
    await client.query('COMMIT;');
    console.log('[WorkSphere DB] Schema migration completed successfully on Supabase!');

    // Query list of created tables
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log(`[WorkSphere DB] Verified ${tableRes.rows.length} public tables in Supabase:`);
    tableRes.rows.forEach(r => console.log(`  - ${r.table_name}`));
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('[ERROR] Migration failed and was rolled back:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
