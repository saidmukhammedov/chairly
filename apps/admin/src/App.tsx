import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PageLoader } from './components/PageLoader';

// Code-split routes for instant initial page loads
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const ApplyBusiness = lazy(() => import('./pages/ApplyBusiness').then((m) => ({ default: m.ApplyBusiness })));
const Applications = lazy(() => import('./pages/Applications').then((m) => ({ default: m.Applications })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Appointments = lazy(() => import('./pages/Appointments').then((m) => ({ default: m.Appointments })));
const Services = lazy(() => import('./pages/Services').then((m) => ({ default: m.Services })));
const Staff = lazy(() => import('./pages/Staff').then((m) => ({ default: m.Staff })));
const Customers = lazy(() => import('./pages/Customers').then((m) => ({ default: m.Customers })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const ShopManagement = lazy(() => import('./pages/ShopManagement').then((m) => ({ default: m.ShopManagement })));

// Background prefetch on idle to make route transitions instantaneous
if (typeof window !== 'undefined') {
  const idleCallback =
    (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1200));

  idleCallback(() => {
    // Silently preheat common routes
    import('./pages/Login');
    import('./pages/ApplyBusiness');
  });
}

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/apply" element={<ApplyBusiness />} />
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="services" element={<Services />} />
                <Route path="staff" element={<Staff />} />
                <Route path="customers" element={<Customers />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="shops" element={<ShopManagement />} />
                <Route path="shops-management" element={<ShopManagement />} />
                <Route path="applications" element={<Applications />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;
