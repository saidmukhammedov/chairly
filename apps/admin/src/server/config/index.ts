import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'production',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres.nfkqblsxatrntkdmsppi:Akbarali001%21@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?schema=public',
  jwtSecret: process.env.JWT_SECRET || 'chairly_production_jwt_secret_key_98372619472938',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Tashkent',
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'UZS',
};

export default config;
