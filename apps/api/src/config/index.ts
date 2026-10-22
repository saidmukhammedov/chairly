import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'chairly_jwt_super_secret_development_fallback_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Tashkent',
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'UZS',
};

export default config;
