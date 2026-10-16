import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Overview */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white">
              <div className="w-7 h-7 bg-white text-slate-900 flex items-center justify-center rounded-md font-bold">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">
                EVENT<span className="text-blue-500">FLOW</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Event registration and live capacity management platform engineered for academic hackathons, engineering symposia, and technical masterclasses.
            </p>
          </div>

          {/* Directory Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
              Directory
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-white transition-colors">
                  Events Catalog
                </Link>
              </li>
              <li>
                <a href="/#workflow" className="hover:text-white transition-colors">
                  Registration Workflow
                </a>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  System Architecture
                </Link>
              </li>
            </ul>
          </div>

          {/* Administrative Portal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
              Administration
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/admin/login" className="hover:text-white transition-colors">
                  Admin Sign-In
                </Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-white transition-colors">
                  Operations Dashboard
                </Link>
              </li>
              <li>
                <Link to="/admin/events" className="hover:text-white transition-colors">
                  Event Management
                </Link>
              </li>
              <li>
                <Link to="/admin/registrations" className="hover:text-white transition-colors">
                  Attendee Roster
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {currentYear} EVENTFLOW. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-3 sm:mt-0">
            <span>Concurrency-Protected Capacity</span>
            <span aria-hidden="true">·</span>
            <span>Duplicate Email Prevention</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
