import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { errorHandler } from './middlewares/errorHandler';

// Route imports
import authRoutes from './routes/auth';
import shopsRoutes from './routes/shops';
import servicesRoutes from './routes/services';
import barbersRoutes from './routes/barbers';
import availabilityRoutes from './routes/availability';
import appointmentsRoutes from './routes/appointments';
import dashboardRoutes from './routes/dashboard';
import customersRoutes from './routes/customers';
import shopSettingsRoutes from './routes/shopSettings';
import applicationsRoutes from './routes/applications';
import notificationsRoutes from './routes/notifications';

export const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration based on config.corsOrigin
const allowedOrigins = Array.isArray(config.corsOrigin) ? config.corsOrigin : [config.corsOrigin];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.chairly.uz') ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Health Check
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Chairly API',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes (support both /api/x and /x)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/shops', '/shops'], shopsRoutes);
app.use(['/api/services', '/services'], servicesRoutes);
app.use(['/api/barbers', '/barbers'], barbersRoutes);
app.use(['/api/availability', '/availability'], availabilityRoutes);
app.use(['/api/appointments', '/appointments'], appointmentsRoutes);
app.use(['/api/dashboard', '/dashboard'], dashboardRoutes);
app.use(['/api/customers', '/customers'], customersRoutes);
app.use(['/api/settings', '/settings'], shopSettingsRoutes);
app.use(['/api/applications', '/applications'], applicationsRoutes);
app.use(['/api/notifications', '/notifications'], notificationsRoutes);

// Centralized error handling
app.use(errorHandler);

export default app;
