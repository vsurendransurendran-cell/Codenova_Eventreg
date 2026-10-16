import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';

// Pages
import { HomePage } from './pages/HomePage.tsx';
import { EventsPage } from './pages/EventsPage.tsx';
import { EventDetailsPage } from './pages/EventDetailsPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { AdminLoginPage } from './pages/AdminLoginPage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import { AdminEventsPage } from './pages/AdminEventsPage.tsx';
import { AdminEventFormPage } from './pages/AdminEventFormPage.tsx';
import { AdminRegistrationsPage } from './pages/AdminRegistrationsPage.tsx';

// Protected Route Guard for Admin
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs font-semibold">
        Verifying administrative credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Public Layout Wrapper with Navbar & Footer
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
};

// 404 Not Found Page
const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">404 Error</span>
      <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Page Not Found</h1>
      <p className="text-xs text-slate-500 mt-2 max-w-sm">
        The requested URL could not be located. It may have moved or been decommissioned.
      </p>
      <a
        href="/"
        className="mt-6 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
      >
        Return to Home
      </a>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes with Navbar and Footer */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            }
          />
          <Route
            path="/events"
            element={
              <PublicLayout>
                <EventsPage />
              </PublicLayout>
            }
          />
          <Route
            path="/events/:eventId"
            element={
              <PublicLayout>
                <EventDetailsPage />
              </PublicLayout>
            }
          />
          <Route
            path="/about"
            element={
              <PublicLayout>
                <AboutPage />
              </PublicLayout>
            }
          />
          <Route
            path="/admin/login"
            element={
              <PublicLayout>
                <AdminLoginPage />
              </PublicLayout>
            }
          />

          {/* Protected Administrator Routes */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboardPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedAdminRoute>
                <AdminEventsPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/events/new"
            element={
              <ProtectedAdminRoute>
                <AdminEventFormPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/events/:eventId/edit"
            element={
              <ProtectedAdminRoute>
                <AdminEventFormPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/registrations"
            element={
              <ProtectedAdminRoute>
                <AdminRegistrationsPage />
              </ProtectedAdminRoute>
            }
          />

          {/* Catch-all 404 */}
          <Route
            path="*"
            element={
              <PublicLayout>
                <NotFoundPage />
              </PublicLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
