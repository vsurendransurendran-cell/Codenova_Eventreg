import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, ChevronLeft, ChevronRight, RotateCcw, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api.ts';
import { EventItem, Pagination } from '../types/index.ts';
import { EventCard } from '../components/EventCard.tsx';

export const EventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryQ = searchParams.get('q') || '';
  const queryCat = searchParams.get('category') || 'all';
  const queryStatus = searchParams.get('status') || 'upcoming';
  const queryFormat = searchParams.get('format') || 'all';
  const querySort = searchParams.get('sort') || 'date_asc';
  const queryPage = parseInt(searchParams.get('page') || '1', 10);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 9, pages: 1 });
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search input local state
  const [searchInput, setSearchInput] = useState(queryQ);

  // Sync search input if query param changes
  useEffect(() => {
    setSearchInput(queryQ);
  }, [queryQ]);

  // Load Categories once
  useEffect(() => {
    api.getCategories().then((res) => {
      if (res.success) setCategories(res.categories);
    }).catch(console.error);
  }, []);

  // Fetch Events from server when query parameters change
  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await api.getEvents({
          q: queryQ,
          category: queryCat,
          status: queryStatus,
          format: queryFormat,
          sort: querySort,
          page: queryPage,
          limit: 9,
        });

        if (res.success) {
          setEvents(res.events);
          setPagination(res.pagination);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load events from the database.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();
  }, [queryQ, queryCat, queryStatus, queryFormat, querySort, queryPage]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', searchInput.trim());
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', newPage.toString());
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = queryQ !== '' || queryCat !== 'all' || queryFormat !== 'all' || queryStatus !== 'upcoming';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Context Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Catalog &amp; Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Explore Events &amp; Masterclasses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Browse verified workshops, symposia, and coding masterclasses with live capacity reservation and atomic registration.
          </p>
        </div>
        <div className="text-xs text-slate-500 tabular-nums">
          <span className="font-semibold text-slate-900">{pagination.total}</span> events found
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        {/* Row 1: Search and Submit */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by event title, speaker, or topics..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
          >
            Search
          </button>
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                updateParam('q', '');
              }}
              className="p-2 text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Row 2: Select Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Category
            </label>
            <select
              value={queryCat}
              onChange={(e) => updateParam('category', e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category} ({c.count})
                </option>
              ))}
            </select>
          </div>

          {/* Format Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Delivery Format
            </label>
            <select
              value={queryFormat}
              onChange={(e) => updateParam('format', e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Formats</option>
              <option value="In-Person">In-Person</option>
              <option value="Online">Online</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Status
            </label>
            <select
              value={queryStatus}
              onChange={(e) => updateParam('status', e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-600"
            >
              <option value="upcoming">Upcoming &amp; Open</option>
              <option value="all">All Statuses</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Concluded</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Sort By
            </label>
            <select
              value={querySort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-600"
            >
              <option value="date_asc">Date (Earliest First)</option>
              <option value="date_desc">Date (Latest First)</option>
              <option value="title_asc">Alphabetical (A - Z)</option>
              <option value="capacity">Total Capacity</option>
            </select>
          </div>
        </div>

        {/* Filter State Banner */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span>
              Showing filtered results (<span className="tabular-nums font-semibold">{pagination.total}</span> matching events)
            </span>
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 font-semibold text-slate-900 hover:text-blue-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-3 text-rose-800 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-80 bg-slate-100 rounded-xl animate-pulse border border-slate-200"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto">
          <Filter className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No events matched your criteria</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search terms, selecting another category, or resetting active filters.
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="mt-4 px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            Clear Active Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}

      {/* Server Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePageChange(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors tabular-nums ${
                p === pagination.page
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
