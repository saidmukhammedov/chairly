import app from './app';
import { config } from './config';

export default function handler(req: any, res: any) {
  const origin = req.headers?.origin;
  const allowed = Array.isArray(config.corsOrigin) ? config.corsOrigin : [config.corsOrigin];

  if (
    origin &&
    (allowed.includes('*') ||
      allowed.includes(origin) ||
      origin.endsWith('.chairly.uz') ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost'))
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (allowed.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return app(req, res);
}
