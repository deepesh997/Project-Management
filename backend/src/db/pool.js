import pg from 'pg';
import { config } from '../config/env.js';

const { Pool } = pg;

export function createPgPool() {
  const dbConfig = config.database;

  // Build connection configuration
  let poolConfig;

  if (dbConfig.url && !dbConfig.url.includes('YOUR_SUPABASE_PASSWORD') && !dbConfig.url.includes('your_secure_db_password')) {
    poolConfig = {
      connectionString: dbConfig.url,
      ssl: dbConfig.ssl,
    };
  } else if (dbConfig.password && dbConfig.password !== 'YOUR_SUPABASE_PASSWORD_HERE') {
    poolConfig = {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
      ssl: dbConfig.ssl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  } else {
    // No live password provided yet
    return null;
  }

  return new Pool(poolConfig);
}

export const pool = createPgPool();

export async function testConnection() {
  if (!pool) {
    return {
      connected: false,
      reason: 'NO_CREDENTIALS',
      message: 'Supabase password has not been set in .env yet.',
    };
  }

  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() AS current_time, current_database() AS db_name, version();');
    client.release();
    return {
      connected: true,
      database: res.rows[0].db_name,
      serverTime: res.rows[0].current_time,
      version: res.rows[0].version,
    };
  } catch (err) {
    return {
      connected: false,
      reason: 'CONNECTION_FAILED',
      message: err.message,
    };
  }
}
