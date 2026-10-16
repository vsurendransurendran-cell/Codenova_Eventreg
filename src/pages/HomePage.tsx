import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { api } from '../utils/api.ts';
import { EventItem } from '../types/index.ts';
import { EventCard } from '../components/EventCard.tsx';

export const HomePage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [eventsRes, catRes] = await Promise.all([
          api.getEvents({ limit: 6, sort: 'date_asc' }),
          api.getCategories(),
        ]);
        if (eventsRes.success) {
          setEvents(eventsRes.events);
        }
        if (catRes.success) {
          setCategories(catRes.categories);
        }
      } catch (err) {
        console.error('Failed to load home page events:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    navigate(`/events?${params.toString()}`);
  };

  const featuredEvent = events[0];

  return (
    <div className="space-y-16 pb-20">
      {/* Editorial High-Impact Hero Section */}
      <section className="relative bg-slate-950 text-white pt-14 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Proposition & Action */}
            <div className="lg:col-span-7 space-y-6">
              <div className="text-xs font-semibold tracking-wider text-blue-400 uppercase">
                Academic & Technical Event Platform
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-white text-balance leading-[1.15]">
                Reserve your seat at premier technical workshops, hackathons, and symposia.
              </h1>

              <p className="text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
                EVENTFLOW delivers verified registration and real-time capacity management for engineering summits, university hackathons, and developer masterclasses with database-backed concurrency control.
              </p>

              {/* Functional Search & Filter Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row gap-2 shadow-xl"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by topic, speaker, or venue..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm bg-slate-950 text-white placeholder:text-slate-500 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-950 text-slate-200 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category} ({cat.count})
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg transition-colors shrink-0 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>Search Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Trust Indicators: Clean Unboxed Text with Separators */}
              <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Zero Overbooking Guarantee</span>
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Duplicate Prevention Protocol</span>
                </span>
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span>Instant Verified Pass</span>
                </span>
              </div>
            </div>

            {/* Right Column: Visual Showcase Anchor */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
                <img
                  src="/src/assets/images/hero_tech_symposium_1792117175219.jpg"
                  alt="Premier engineering tech symposium auditorium"
                  referrerPolicy="no-referrer"
                  className="w-full h-80 sm:h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold tracking-wider uppercase">
                    <span>Featured Event</span>
                    <span aria-hidden="true">·</span>
                    <span>Systems & AI</span>
                  </div>

                  <h3 className="text-lg font-bold text-white leading-tight">
                    {featuredEvent ? featuredEvent.title : 'CodeNova National Hackathon 2026: Systems & AI'}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span className="tabular-nums">
                        {featuredEvent ? `${featuredEvent.confirmedRegistrationsCount} / ${featuredEvent.maxCapacity} seats filled` : '150 Max Capacity'}
                      </span>
                    </span>

                    {featuredEvent ? (
                      <Link
                        to={`/events/${featuredEvent._id}`}
                        className="font-semibold text-white hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-width 4-Column Metric Strip (Below Hero Split) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl shadow-xs divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="p-6">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">100%</div>
            <div className="text-xs font-medium text-slate-600 mt-1">Atomic Seat Allocation</div>
            <p className="text-[11px] text-slate-500 mt-1">Zero capacity overruns under high concurrency</p>
          </div>
          <div className="p-6">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">&lt; 150ms</div>
            <div className="text-xs font-medium text-slate-600 mt-1">Reservation Latency</div>
            <p className="text-[11px] text-slate-500 mt-1">Instant confirmation & credential pass</p>
          </div>
          <div className="p-6">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">409 Conflict</div>
            <div className="text-xs font-medium text-slate-600 mt-1">Duplicate Protection</div>
            <p className="text-[11px] text-slate-500 mt-1">Unique compound index on email & event</p>
          </div>
          <div className="p-6">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">8 Active</div>
            <div className="text-xs font-medium text-slate-600 mt-1">Curated Curriculums</div>
            <p className="text-[11px] text-slate-500 mt-1">Across hackathons, AI & architecture</p>
          </div>
        </div>
      </section>

      {/* Featured Upcoming Events Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Live Opportunities
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Upcoming Events & Masterclasses
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select an event to inspect syllabus, venue logistics, remaining capacity, and reserve your seat.
            </p>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap"
          >
            <span>View All Events ({events.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Interactive Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            All Events
          </button>
          {categories.map((c) => (
            <button
              key={c.category}
              onClick={() => setSelectedCategory(c.category)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedCategory === c.category
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {c.category} <span className="tabular-nums text-slate-400">({c.count})</span>
            </button>
          ))}
        </div>

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
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl p-8">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No events currently scheduled</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Our academic administrators are preparing the next cycle of workshops and hackathons.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events
              .filter((ev) => selectedCategory === 'all' || ev.category === selectedCategory)
              .map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
          </div>
        )}
      </section>

      {/* Human Editorial Numbered Workflow Section */}
      <section id="workflow" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 sm:p-12">
          <div className="max-w-2xl mb-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Registration Lifecycle
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              How Event Registration Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              An end-to-end transparent process engineered with strict database validation and concurrency control.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white border border-slate-200 rounded-xl">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                01. Discovery
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-2">Filter Catalog</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Filter by technical discipline, delivery format (in-person, online, or hybrid), schedule, and live capacity status.
              </p>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-xl">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                02. Evaluation
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-2">Inspect Details</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Review speaker credentials, prerequisites, venue logistics, registration deadlines, and remaining seat counts.
              </p>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-xl">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                03. Submission
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-2">Submit Affiliation</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Enter your institutional affiliation and domain interests. Normalized email addresses prevent duplicate registrations.
              </p>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-xl">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                04. Confirmation
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-2">Verified Credential</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Receive your unique registration reference code (<span className="font-mono text-slate-900 font-semibold">EVF-...</span>) backed by atomic capacity incrementation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Asymmetric Showcase: Engineering Masterclasses */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 overflow-hidden">
          <div className="lg:col-span-6 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Interactive Masterclasses
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hands-on instruction from lead industry architects.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every masterclass is structured with dedicated code walkthroughs, direct mentor interaction, and production-tested patterns. Capacity is deliberately capped to maintain low student-to-mentor ratios.
            </p>
            <div className="pt-2">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <span>Browse All Available Seats</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <img
                src="/src/assets/images/masterclass_workshop_1792117175223.jpg"
                alt="Technology masterclass workshop session"
                referrerPolicy="no-referrer"
                className="w-full h-72 sm:h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
