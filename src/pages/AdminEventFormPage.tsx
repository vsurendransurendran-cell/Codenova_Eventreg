import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Users,
  Clock,
  MapPin,
  Loader2,
} from 'lucide-react';
import { api } from '../utils/api.ts';
import { EventItem } from '../types/index.ts';
import { AdminSidebar } from '../components/AdminSidebar.tsx';

const CATEGORIES = [
  'Technology',
  'Engineering',
  'Career & Networking',
  'Design & Product',
  'Science & Research',
  'Workshop & Hackathon',
  'Leadership',
];

export const AdminEventFormPage: React.FC = () => {
  const { eventId } = useParams<{ eventId?: string }>();
  const isEditing = Boolean(eventId);
  const navigate = useNavigate();

  // Form Fields
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [category, setCategory] = useState('Technology');
  const [format, setFormat] = useState<'In-Person' | 'Online' | 'Hybrid'>('In-Person');
  const [venue, setVenue] = useState('');
  const [timeZone, setTimeZone] = useState('America/New_York');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('100');
  const [status, setStatus] = useState<'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled'>('upcoming');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [prerequisites, setPrerequisites] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [speakerRole, setSpeakerRole] = useState('');
  const [speakerCompany, setSpeakerCompany] = useState('');
  const [speakerBio, setSpeakerBio] = useState('');

  const [existingEvent, setExistingEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing || !eventId) return;

    async function loadEvent() {
      setIsLoading(true);
      try {
        const res = await api.getEventById(eventId!);
        if (res.success && res.event) {
          const ev = res.event;
          setExistingEvent(ev);
          setTitle(ev.title);
          setShortDescription(ev.shortDescription);
          setFullDescription(ev.fullDescription);
          setCategory(ev.category);
          setFormat(ev.format);
          setVenue(ev.venue);
          setTimeZone(ev.timeZone || 'America/New_York');
          setStatus(ev.status);
          setMaxCapacity(ev.maxCapacity.toString());
          setImageUrl(ev.imageUrl || '');
          setPrerequisites(ev.prerequisites || '');
          setTags((ev.tags || []).join(', '));

          if (ev.speakerInfo) {
            setSpeakerName(ev.speakerInfo.name || '');
            setSpeakerRole(ev.speakerInfo.role || '');
            setSpeakerCompany(ev.speakerInfo.company || '');
            setSpeakerBio(ev.speakerInfo.bio || '');
          }

          // Format ISO strings to datetime-local format YYYY-MM-DDTHH:mm
          if (ev.startDate) setStartDate(new Date(ev.startDate).toISOString().slice(0, 16));
          if (ev.endDate) setEndDate(new Date(ev.endDate).toISOString().slice(0, 16));
          if (ev.registrationDeadline) {
            setRegistrationDeadline(new Date(ev.registrationDeadline).toISOString().slice(0, 16));
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to load event details.');
      } finally {
        setIsLoading(false);
      }
    }

    loadEvent();
  }, [eventId, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Date order checks
    const start = new Date(startDate);
    const end = new Date(endDate);
    const deadline = new Date(registrationDeadline);

    if (end <= start) {
      setErrorMessage('Event end date must occur after the start date.');
      return;
    }
    if (deadline > end) {
      setErrorMessage('Registration deadline cannot be after the event finishes.');
      return;
    }

    const capNum = parseInt(maxCapacity, 10);
    if (isNaN(capNum) || capNum < 1) {
      setErrorMessage('Maximum capacity must be an integer of 1 or greater.');
      return;
    }

    // Capacity reduction invariant check
    if (isEditing && existingEvent && capNum < existingEvent.confirmedRegistrationsCount) {
      setErrorMessage(
        `Cannot reduce capacity to ${capNum}. There are already ${existingEvent.confirmedRegistrationsCount} confirmed participants.`
      );
      return;
    }

    setIsSubmitting(true);

    const payload: Partial<EventItem> = {
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim(),
      category,
      format,
      venue: venue.trim(),
      timeZone,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      registrationDeadline: deadline.toISOString(),
      maxCapacity: capNum,
      status,
      imageUrl: imageUrl.trim() || undefined,
      prerequisites: prerequisites.trim() || undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      speakerInfo: speakerName.trim()
        ? {
            name: speakerName.trim(),
            role: speakerRole.trim(),
            company: speakerCompany.trim() || undefined,
            bio: speakerBio.trim() || undefined,
          }
        : undefined,
    };

    try {
      if (isEditing && eventId) {
        const res = await api.updateAdminEvent(eventId, payload);
        if (res.success) {
          setSuccessMessage('Event updated successfully!');
          setTimeout(() => navigate('/admin/events'), 1500);
        }
      } else {
        const res = await api.createAdminEvent(payload);
        if (res.success) {
          setSuccessMessage('Event created successfully!');
          setTimeout(() => navigate('/admin/events'), 1500);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 sm:p-10 max-w-5xl">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div>
            <Link
              to="/admin/events"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Events List</span>
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isEditing ? `Edit: ${title || 'Event'}` : 'Create New Event'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify schedule, location constraints, and capacity limits.
            </p>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
            Loading event configuration...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Basic Information */}
            <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-stone-100 pb-2">
                1. Basic Information
              </h2>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase">
                  Event Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CodeNova Systems & AI Hackathon 2026"
                  className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase">
                    Category <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-md focus:bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase">
                    Format <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-md focus:bg-white"
                  >
                    <option value="In-Person">In-Person</option>
                    <option value="Online">Online</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase">
                    Status Lifecycle <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-md focus:bg-white"
                  >
                    <option value="upcoming">Upcoming (Active)</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="draft">Draft</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase">
                  Venue / Location / Meeting Link <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Science Auditorium Room 302, or Zoom Webinar link"
                  className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase">
                  Short Description (Catalog Preview) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Concise 1-2 sentence overview for event cards..."
                  className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase">
                  Full Detailed Description / Syllabus <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Complete schedule, learning outcomes, and session expectations..."
                  className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Schedule & Capacity Management */}
            <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-stone-100 pb-2">
                2. Schedule & Capacity Invariants
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase">
                    Start Date & Time <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-md focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase">
                    End Date & Time <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-md focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase">
                    Registration Deadline <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-md focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase">
                    Maximum Capacity (Seats) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:bg-white"
                  />
                  {existingEvent && (
                    <p className="text-[11px] text-stone-500 mt-1">
                      Currently confirmed: <strong className="text-slate-900">{existingEvent.confirmedRegistrationsCount}</strong> attendees. Cannot be reduced below this count.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase">
                    Time Zone
                  </label>
                  <input
                    type="text"
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    placeholder="e.g. America/New_York or UTC"
                    className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Speaker & Additional Metadata */}
            <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-stone-100 pb-2">
                3. Speaker & Additional Information (Optional)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase">
                    Speaker Name
                  </label>
                  <input
                    type="text"
                    value={speakerName}
                    onChange={(e) => setSpeakerName(e.target.value)}
                    placeholder="e.g. Dr. Jane Smith"
                    className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase">
                    Speaker Title / Role
                  </label>
                  <input
                    type="text"
                    value={speakerRole}
                    onChange={(e) => setSpeakerRole(e.target.value)}
                    placeholder="e.g. Staff Engineer"
                    className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={speakerCompany}
                    onChange={(e) => setSpeakerCompany(e.target.value)}
                    placeholder="e.g. Tech Systems Inc."
                    className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase">
                  Prerequisites / Requirements
                </label>
                <input
                  type="text"
                  value={prerequisites}
                  onChange={(e) => setPrerequisites(e.target.value)}
                  placeholder="e.g. Bring laptop with Node.js and Docker installed"
                  className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. AI, Full-Stack, Docker, TypeScript"
                  className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase">
                  Image URL (Banner)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:bg-white"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Link
                to="/admin/events"
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center space-x-2 px-6 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Event...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditing ? 'Save Changes' : 'Publish Event'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};
