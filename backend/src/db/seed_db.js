import bcrypt from 'bcryptjs';
import { createPgPool, testConnection } from './pool.js';

async function seedDatabase() {
  console.log('[WorkSphere DB] Connecting to Supabase for seeding...');
  const check = await testConnection();
  if (!check.connected) {
    console.error(`[ERROR] Could not connect to Supabase: ${check.message}`);
    process.exit(1);
  }

  const pool = createPgPool();
  const client = await pool.connect();
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('Password123!', salt);

  try {
    await client.query('BEGIN;');

    // 1. Organizations
    await client.query(`
      INSERT INTO organizations (id, name, slug, plan)
      VALUES 
        ('org-acme-101', 'Acme Technologies Inc.', 'acme-corp', 'ENTERPRISE'),
        ('org-globex-202', 'Globex Global Ltd.', 'globex-global', 'PRO')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 2. Users
    const users = [
      ['usr-admin-1', 'admin@worksphere.io', passwordHash, 'Super Administrator'],
      ['usr-owner-1', 'owner@acme.com', passwordHash, 'Elena Vance (Owner)'],
      ['usr-pm-1', 'pm@acme.com', passwordHash, 'Marcus Brody (PM)'],
      ['usr-member-1', 'member@acme.com', passwordHash, 'Sarah Connor (Dev)'],
      ['usr-auditor-1', 'auditor@acme.com', passwordHash, 'Arthur Pendelton (Auditor)'],
      ['usr-globex-1', 'hacker@globex.com', passwordHash, 'Victor Shade (Rival Tenant)'],
    ];

    for (const [id, email, hash, name] of users) {
      await client.query(`
        INSERT INTO users (id, email, password_hash, full_name, is_active)
        VALUES ($1, $2, $3, $4, TRUE)
        ON CONFLICT (id) DO NOTHING;
      `, [id, email, hash, name]);
    }

    // 3. Organization Memberships
    const memberships = [
      ['mem-usr-admin-1', 'org-acme-101', 'usr-admin-1', 'platform_admin'],
      ['mem-usr-owner-1', 'org-acme-101', 'usr-owner-1', 'org_owner'],
      ['mem-usr-pm-1', 'org-acme-101', 'usr-pm-1', 'project_manager'],
      ['mem-usr-member-1', 'org-acme-101', 'usr-member-1', 'team_member'],
      ['mem-usr-auditor-1', 'org-acme-101', 'usr-auditor-1', 'auditor'],
      ['mem-usr-globex-1', 'org-globex-202', 'usr-globex-1', 'team_member'],
    ];

    for (const [id, orgId, userId, role] of memberships) {
      await client.query(`
        INSERT INTO organization_memberships (id, org_id, user_id, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING;
      `, [id, orgId, userId, role]);
    }

    // 4. Project
    await client.query(`
      INSERT INTO projects (id, org_id, name, description, status, owner_id)
      VALUES (
        'proj-acme-alpha',
        'org-acme-101',
        'Phoenix Multi-Cloud Architecture',
        'Next-gen enterprise cloud transformation roadmap.',
        'ACTIVE',
        'usr-pm-1'
      )
      ON CONFLICT (id) DO NOTHING;
    `);

    // 5. Tasks (with OCC Version = 1)
    await client.query(`
      INSERT INTO tasks (
        id, project_id, org_id, title, description, status, priority, assignee_id, creator_id, estimated_hours, actual_hours, version
      )
      VALUES (
        'task-concurrency-target',
        'proj-acme-alpha',
        'org-acme-101',
        'Database Sharding & Connection Pool Tuning',
        'Configure PgBouncer with maximum 500 connections on Supabase.',
        'IN_PROGRESS',
        'HIGH',
        'usr-member-1',
        'usr-pm-1',
        16.0,
        4.5,
        1
      )
      ON CONFLICT (id) DO NOTHING;
    `);

    // 6. Initial Audit Log
    await client.query(`
      INSERT INTO activity_logs (id, org_id, entity_type, entity_id, action, performed_by, payload)
      VALUES (
        'act-seed-init',
        'org-acme-101',
        'DATABASE',
        'supabase-init',
        'MIGRATED_AND_SEEDED',
        'usr-admin-1',
        '{"provider": "Supabase", "region": "ap-northeast-2"}'::jsonb
      )
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query('COMMIT;');
    console.log('[WorkSphere DB] Supabase database seeded with enterprise test data successfully!');
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('[ERROR] Seeding failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
