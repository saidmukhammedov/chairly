import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { CustomerPortal } from '../pages/CustomerPortal';

export const DashboardLayout: React.FC = () => {
  const { user, isLoading, currentShopId } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-chairly-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-chairly-terracotta-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-chairly-muted">Loading Chairly...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If logged in as customer, show dedicated customer portal
  if (user.role === 'CUSTOMER') {
    return <CustomerPortal />;
  }

  if (!currentShopId) {
    return (
      <div className="min-h-screen bg-chairly-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-chairly-border shadow-sm text-center">
          <h2 className="text-xl font-bold text-chairly-dark mb-2">No Barbershop Assigned</h2>
          <p className="text-sm text-chairly-muted mb-6">
            Your account does not currently have staff or manager permissions for any active barbershop.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-chairly-terracotta-500 text-white rounded-xl text-sm font-medium hover:bg-chairly-terracotta-600 transition-colors"
          >
            Refresh Permissions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chairly-bg flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
