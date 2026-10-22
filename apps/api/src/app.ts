import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
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

export const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Chairly API',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/barbers', barbersRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/settings', shopSettingsRoutes);

// Centralized error handling
app.use(errorHandler);

export default app;
