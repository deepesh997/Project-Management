import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  jwt: {
    secret: process.env.JWT_SECRET || 'worksphere-super-secure-jwt-secret-key-2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'worksphere-super-secure-refresh-key-2026',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  database: {
    host: process.env.DB_HOST || 'aws-0-ap-northeast-2.pooler.supabase.com',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres.qiquvsipdeorewhatbou',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
    url: process.env.DATABASE_URL || '',
    useMemoryFallback: process.env.USE_MEMORY_FALLBACK !== 'false',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  webhook: {
    secret: process.env.WEBHOOK_SECRET || 'whsec_worksphere_signature_secret_test_key_99',
  },
  analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8000',
  analyticsApiKey: process.env.ANALYTICS_API_KEY || 'ws-analytics-secret-key-prod-2026',
};
