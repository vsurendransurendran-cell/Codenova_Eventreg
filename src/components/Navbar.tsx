import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Shield, Menu, X, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-slate-900 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm whitespace-nowrap shrink-0"
          >
            <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center rounded-lg font-bold tracking-tight shadow-sm transition-transform group-hover:scale-105">
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              EVENT<span className="text-blue-600">FLOW</span>
            </span>
          </Link>

          {/* Zone 2: 4-5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600" aria-label="Main Navigation">
            <Link
              to="/events"
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                isActive('/events') ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Explore Events
            </Link>
            <a
              href="/#workflow"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <Link
              to="/about"
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                isActive('/about') ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Architecture
            </Link>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 rounded-md hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Admin ({user?.username})</span>
              </Link>
            ) : (
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 rounded-md transition-colors whitespace-nowrap shrink-0"
                title="Administrator Sign-In"
              >
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Admin Portal</span>
              </Link>
            )}

            <Link
              to="/events"
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
            >
              <span>Register for Event</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 text-sm font-semibold rounded-md ${
              isActive('/events')
                ? 'bg-blue-50 text-blue-900'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Explore Events
          </Link>
          <a
            href="/#workflow"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-md"
          >
            How It Works
          </a>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 text-sm font-semibold rounded-md ${
              isActive('/about')
                ? 'bg-blue-50 text-blue-900'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Architecture
          </Link>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-900 bg-slate-100 border border-slate-200 rounded-md"
              >
                <span>Dashboard ({user?.username})</span>
                <Shield className="w-4 h-4 text-blue-600" />
              </Link>
            ) : (
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-md border border-slate-200"
              >
                <span>Administrator Sign-in</span>
                <Shield className="w-4 h-4 text-slate-400" />
              </Link>
            )}
            <Link
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              <span>Browse All Events</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
