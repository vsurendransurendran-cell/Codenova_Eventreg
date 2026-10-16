import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Users,
  UserX,
  PieChart,
  PlusCircle,
  Download,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { api } from '../utils/api.ts';
import { DashboardStats, EventItem } from '../types/index.ts';
import { AdminSidebar } from '../components/AdminSidebar.tsx';
import { CapacityBadge } from '../components/CapacityBadge.tsx';
import { formatEventDateTime } from '../utils/registrationRules.ts';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [statsRes, eventsRes] = await Promise.all([
          api.getAdminStats(),
          api.getAdminEvents({ limit: 5, sort: 'date_asc' }),
        ]);

        if (statsRes.success) {
          setStats(statsRes.stats);
        }
        if (eventsRes.success) {
          setRecentEvents(eventsRes.events);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to load administrative dashboard.');
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 sm:p-10 max-w-7xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Operations Center
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Platform Overview &amp; Metrics
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live capacity telemetry and registration aggregates calculated across active events.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={api.getExportRegistrationsUrl()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
              download
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
            <Link
              to="/admin/events/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Event</span>
            </Link>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live Aggregates Metrics Row */}
        {isLoading ? (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Events */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Events</span>
                <CalendarDays className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.totalEvents}</span>
                <span className="text-xs text-blue-600 font-semibold tabular-nums">
                  ({stats.upcomingEvents} active)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
                {stats.completedEvents} concluded · {stats.cancelledEvents} cancelled
              </p>
            </div>

            {/* Confirmed Registrations */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Confirmed Attendees</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {stats.totalConfirmedRegistrations}
                </span>
                <span className="text-xs text-slate-500 font-medium">participants</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
                {stats.occupancyRate}% global occupancy
              </p>
            </div>

            {/* Remaining Capacity */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Open Seat Quota</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.remainingCapacity}</span>
                <span className="text-xs text-slate-500 tabular-nums">of {stats.totalCapacity} total</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                Atomic capacity reservation active
              </p>
            </div>

            {/* Cancelled Registrations */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Cancelled Registrations</span>
                <UserX className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-700 tabular-nums">
                  {stats.totalCancelledRegistrations}
                </span>
                <span className="text-xs text-slate-500">seats restored</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Capacity replenished upon cancellation
              </p>
            </div>
          </div>
        ) : null}

        {/* Two Column Grid: Category Breakdown vs Recent Events */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Category Distribution (1 Col) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-4 border-b border-slate-100">
              <PieChart className="w-4 h-4 text-blue-600" />
              <span>Disciplines &amp; Attendance</span>
            </h2>

            {stats?.categoryDistribution && stats.categoryDistribution.length > 0 ? (
              <div className="mt-4 space-y-4">
                {stats.categoryDistribution.map((item) => {
                  const percent =
                    stats.totalConfirmedRegistrations > 0
                      ? Math.round(
                          (item.confirmedRegistrations / stats.totalConfirmedRegistrations) * 100
                        )
                      : 0;

                  return (
                    <div key={item.category} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800">{item.category}</span>
                        <span className="text-slate-500 font-medium tabular-nums">
                          {item.confirmedRegistrations} attendees ({item.eventsCount} events)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-4">No category statistics available.</p>
            )}
          </div>

          {/* Recent Events Table (2 Cols) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Upcoming Events</span>
              </h2>
              <Link
                to="/admin/events"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
              >
                <span>Manage All Events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No events have been created yet.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="pb-3 pr-4">Event</th>
                      <th className="pb-3 px-4">Date</th>
                      <th className="pb-3 px-4">Capacity</th>
                      <th className="pb-3 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentEvents.map((event) => (
                      <tr key={event._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 pr-4">
                          <Link
                            to={`/admin/events/${event._id}/edit`}
                            className="font-semibold text-slate-900 hover:text-blue-600 block line-clamp-1"
                          >
                            {event.title}
                          </Link>
                          <span className="text-[11px] text-slate-400">
                            {event.category} · {event.format}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {formatEventDateTime(event.startDate, event.timeZone)}
                        </td>
                        <td className="py-3 px-4">
                          <CapacityBadge
                            maxCapacity={event.maxCapacity}
                            confirmedCount={event.confirmedRegistrationsCount}
                            remainingCapacity={event.remainingCapacity ?? Math.max(0, event.maxCapacity - (event.confirmedRegistrationsCount || 0))}
                            status={event.status}
                            size="sm"
                          />
                        </td>
                        <td className="py-3 pl-4 text-right whitespace-nowrap">
                          <Link
                            to={`/admin/events/${event._id}/edit`}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
