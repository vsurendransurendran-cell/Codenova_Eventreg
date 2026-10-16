import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Edit2,
  Users,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { api } from '../utils/api.ts';
import { EventItem, Pagination } from '../types/index.ts';
import { AdminSidebar } from '../components/AdminSidebar.tsx';
import { CapacityBadge } from '../components/CapacityBadge.tsx';
import { formatEventDateTime } from '../utils/registrationRules.ts';

export const AdminEventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryQ = searchParams.get('q') || '';
  const queryStatus = searchParams.get('status') || 'all';
  const queryPage = parseInt(searchParams.get('page') || '1', 10);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 15, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState(queryQ);

  const fetchEvents = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.getAdminEvents({
        q: queryQ,
        status: queryStatus,
        page: queryPage,
        limit: 15,
        sort: 'date_asc',
      });
      if (res.success) {
        setEvents(res.events);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to retrieve administrative events.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [queryQ, queryStatus, queryPage]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', searchInput.trim());
  };

  const handleDeleteOrCancel = async (event: EventItem) => {
    const isPermanent = event.confirmedRegistrationsCount === 0;
    const confirmPrompt = isPermanent
      ? `Delete "${event.title}" permanently?`
      : `Event has ${event.confirmedRegistrationsCount} registered participants. Setting status to "cancelled" will preserve database audit logs. Proceed?`;

    if (!window.confirm(confirmPrompt)) return;

    try {
      const res = await api.deleteAdminEvent(event._id);
      if (res.success) {
        setActionSuccess(res.message);
        setTimeout(() => setActionSuccess(null), 4000);
        fetchEvents();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 sm:p-10 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Operations
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Event Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure curriculums, venues, capacity caps, and schedule lifecycles.
            </p>
          </div>

          <Link
            to="/admin/events/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Event</span>
          </Link>
        </div>

        {/* Feedback alerts */}
        {actionSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by event title, venue, or keywords..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </form>

          <select
            value={queryStatus}
            onChange={(e) => updateParam('status', e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Events Table */}
        <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Event Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Capacity Status</th>
                  <th className="py-3 px-4">Lifecycle</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Loading administrative events...
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No events found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-[220px]">
                        <div className="truncate">{ev.title}</div>
                        <div className="text-[11px] font-normal text-slate-500 truncate">
                          {ev.venue} ({ev.format})
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {ev.category}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="whitespace-nowrap">{formatEventDateTime(ev.startDate, ev.timeZone)}</div>
                        <div className="text-[10px] text-slate-400 whitespace-nowrap">
                          Cutoff: {formatEventDateTime(ev.registrationDeadline, ev.timeZone)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 tabular-nums">
                          {ev.confirmedRegistrationsCount} / {ev.maxCapacity} seats
                        </div>
                        <div className="text-[10px] text-slate-500 tabular-nums">
                          {ev.remainingCapacity} remaining
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            ev.status === 'upcoming'
                              ? 'bg-emerald-50 text-emerald-800'
                              : ev.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-800'
                              : ev.status === 'completed'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {ev.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <Link
                          to={`/events/${ev._id}`}
                          className="inline-flex items-center p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="View Public Page"
                          target="_blank"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/admin/registrations?eventId=${ev._id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors tabular-nums"
                          title="View Registered Attendees"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Attendees ({ev.confirmedRegistrationsCount})</span>
                        </Link>
                        <Link
                          to={`/admin/events/${ev._id}/edit`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrCancel(ev)}
                          className="inline-flex items-center p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
                          title={ev.confirmedRegistrationsCount > 0 ? 'Cancel Event' : 'Delete Event'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 tabular-nums">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total events)
              </span>
              <div className="space-x-1">
                <button
                  type="button"
                  onClick={() => updateParam('page', (pagination.page - 1).toString())}
                  disabled={pagination.page <= 1}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-md disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('page', (pagination.page + 1).toString())}
                  disabled={pagination.page >= pagination.pages}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-md disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
