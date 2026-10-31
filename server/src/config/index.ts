import { z } from 'zod';

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT_API: z.coerce.number().default(4000),
  PORT_INGEST: z.coerce.number().default(4001),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/mizan_dev?replicaSet=rs0'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(16).default('dev-jwt-secret-mizan-production-grade-at-least-32-chars-long'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(16).default('dev-refresh-secret-mizan-high-entropy-token-key-32'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  WEBHOOK_SIGNING_MASTER_KEY: z.string().min(32).default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  CHAPA_SECRET_KEY: z.string().default('CHASECK_TEST-fake-chapa-secret-key-for-development'),
  CHAPA_PUBLIC_KEY: z.string().default('CHAPUBK_TEST-fake-chapa-public-key-for-development'),
  CHAPA_WEBHOOK_SECRET: z.string().default('fake-chapa-webhook-secret-hash'),
  CHAPA_API_URL: z.string().url().default('https://api.chapa.co/v1'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().default('test'),
  SMTP_PASS: z.string().default('test'),
  SMTP_FROM: z.string().default('Mizan Notifications <no-reply@mizan.et>'),
  BILLING_ENABLED: z.coerce.boolean().default(true),
  INGEST_SAFETY_CAP: z.coerce.number().default(500000),
  MAX_BATCH_SIZE: z.coerce.number().default(100),
  MAX_BATCH_BYTES: z.coerce.number().default(262144),
  LOG_LEVEL: z.string().default('info'),
});

const parsed = ConfigSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid server configuration:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const config = parsed.data;
