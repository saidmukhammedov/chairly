import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[config] Missing required environment variable: ${name}. Set it in your .env or provider environment variables.`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['https://chairly.uz', 'https://www.chairly.uz', 'http://localhost:5173', 'http://localhost:3000'],
  databaseUrl: requireEnv('DATABASE_URL'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Tashkent',
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'UZS',
};

export default config;
