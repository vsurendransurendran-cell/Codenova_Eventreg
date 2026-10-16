import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from 'lucide-react';
import { api } from '../utils/api.ts';
import { RegistrationItem, EventItem, Pagination } from '../types/index.ts';
import { AdminSidebar } from '../components/AdminSidebar.tsx';
import { formatEventDateTime } from '../utils/registrationRules.ts';

export const AdminRegistrationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryEventId = searchParams.get('eventId') || 'all';
  const queryStatus = searchParams.get('status') || 'all';
  const queryQ = searchParams.get('q') || '';
  const queryPage = parseInt(searchParams.get('page') || '1', 10);

  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState(queryQ);
  const [selectedAttendee, setSelectedAttendee] = useState<RegistrationItem | null>(null);

  // Load events list for filter dropdown
  useEffect(() => {
    api.getAdminEvents({ limit: 100 }).then((res) => {
      if (res.success) setEventsList(res.events);
    }).catch(console.error);
  }, []);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.getAdminRegistrations({
        eventId: queryEventId,
        status: queryStatus,
        q: queryQ,
        page: queryPage,
        limit: 20,
      });

      if (res.success) {
        setRegistrations(res.registrations);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to retrieve registrations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [queryEventId, queryStatus, queryQ, queryPage]);

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

  const handleStatusChange = async (
    reg: RegistrationItem,
    newStatus: 'confirmed' | 'cancelled' | 'waitlisted'
  ) => {
    const confirmPrompt =
      newStatus === 'cancelled'
        ? `Cancel registration for ${reg.fullName}? This will restore 1 seat to the event capacity.`
        : `Change status to "${newStatus}" for ${reg.fullName}?`;

    if (!window.confirm(confirmPrompt)) return;

    try {
      const res = await api.updateRegistrationStatus(reg._id, newStatus);
      if (res.success) {
        setActionSuccess(`Registration for ${reg.fullName} updated to ${newStatus}.`);
        setTimeout(() => setActionSuccess(null), 4000);
        fetchRegistrations();
        if (selectedAttendee?._id === reg._id) {
          setSelectedAttendee(res.registration);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update status.');
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
              Registrations &amp; Attendance
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Participant Registry
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Inspect participant credentials, manage attendance status, and export CSV reports.
            </p>
          </div>

          <div>
            <a
              href={api.getExportRegistrationsUrl(queryEventId, queryStatus)}
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
          </div>
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

        {/* Filter controls */}
        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by participant name, email, organization, or ref code..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </form>

          {/* Event Filter */}
          <select
            value={queryEventId}
            onChange={(e) => updateParam('eventId', e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white max-w-xs"
          >
            <option value="all">All Events</option>
            {eventsList.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={queryStatus}
            onChange={(e) => updateParam('status', e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Registrations Table */}
        <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Ref Code</th>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Loading participant registry...
                    </td>
                  </tr>
                ) : registrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No registrations found matching active filters.
                    </td>
                  </tr>
                ) : (
                  registrations.map((reg) => {
                    const eventTitle =
                      typeof reg.eventId === 'object' && reg.eventId !== null
                        ? (reg.eventId as any).title
                        : 'Event';

                    return (
                      <tr key={reg._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {reg.registrationRef}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{reg.fullName}</div>
                          <div className="text-[11px] text-slate-500">{reg.email}</div>
                        </td>
                        <td className="py-3 px-4 max-w-[200px]">
                          <span className="font-medium text-slate-800 truncate block">
                            {eventTitle}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{reg.organization}</td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {formatEventDateTime(reg.registeredAt)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              reg.status === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-800'
                                : reg.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-800'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {reg.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedAttendee(reg)}
                            className="inline-flex items-center p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            title="Inspect Participant"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {reg.status === 'confirmed' ? (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(reg, 'cancelled')}
                              className="px-2 py-0.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                              title="Cancel registration and restore capacity"
                            >
                              Cancel
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(reg, 'confirmed')}
                              className="px-2 py-0.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                              title="Re-confirm attendee"
                            >
                              Confirm
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 tabular-nums">
                Page {pagination.page} of {pagination.pages} ({pagination.total} registrations)
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

        {/* Participant Details Modal */}
        {selectedAttendee && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                    Registration Record
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedAttendee.fullName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAttendee(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Reference Code</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedAttendee.registrationRef}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Status</span>
                    <span className="font-semibold text-slate-900 capitalize">
                      {selectedAttendee.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Email Address</span>
                    <span className="font-medium text-slate-900">{selectedAttendee.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Affiliation</span>
                    <span className="font-medium text-slate-900">{selectedAttendee.organization}</span>
                  </div>
                </div>

                {selectedAttendee.domainInterests && selectedAttendee.domainInterests.length > 0 && (
                  <div>
                    <span className="text-slate-500 font-semibold block mb-1.5">
                      Selected Interests:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedAttendee.domainInterests.map((interest) => (
                        <span
                          key={interest}
                          className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 rounded-md"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAttendee.notes && (
                  <div>
                    <span className="text-slate-500 font-semibold block mb-1">
                      Attendee Notes:
                    </span>
                    <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs">
                      {selectedAttendee.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAttendee(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
