import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  Users,
  LogOut,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Events Management', href: '/admin/events', icon: CalendarDays },
    { name: 'Create Event', href: '/admin/events/new', icon: PlusCircle },
    { name: 'Attendee Registrations', href: '/admin/registrations', icon: Users },
  ];

  const isActive = (path: string) => {
    if (path === '/admin/events/new') return location.pathname === '/admin/events/new';
    if (path === '/admin/events') return location.pathname === '/admin/events' || (location.pathname.startsWith('/admin/events/') && !location.pathname.includes('/new'));
    return location.pathname === path;
  };

  return (
    <aside className="w-full md:w-64 bg-slate-950 text-slate-200 flex flex-col justify-between shrink-0 border-r border-slate-800">
      <div>
        {/* Admin Brand Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-white">
            <div className="w-7 h-7 bg-blue-600 text-white flex items-center justify-center rounded-lg font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">
                EVENT<span className="text-blue-400">FLOW</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Administration Portal</span>
            </div>
          </div>
          {user && (
            <div className="mt-3 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
              <p className="font-semibold text-white truncate">{user.fullName || user.username}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1" aria-label="Administrator navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-800 space-y-1.5">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Public Directory</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
