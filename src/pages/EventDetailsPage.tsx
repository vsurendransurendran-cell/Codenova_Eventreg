import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Share2,
  Tag,
  Briefcase,
  BookOpen,
} from 'lucide-react';
import { api } from '../utils/api.ts';
import { EventItem } from '../types/index.ts';
import { CapacityBadge } from '../components/CapacityBadge.tsx';
import { RegistrationModal } from '../components/RegistrationModal.tsx';
import { formatEventDateTime } from '../utils/registrationRules.ts';

export const EventDetailsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fetchEvent = async (isSilent = false) => {
    if (!eventId) return;
    if (!isSilent) {
      setIsLoading(true);
      setErrorMessage(null);
    }

    try {
      const res = await api.getEventById(eventId);
      if (res.success && res.event) {
        setEvent(res.event);
      } else if (!isSilent) {
        setErrorMessage('Event could not be found.');
      }
    } catch (err: any) {
      if (!isSilent) {
        setErrorMessage(err.message || 'Unable to retrieve event details.');
      }
    } finally {
      if (!isSilent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="h-8 bg-slate-200 w-1/3 mx-auto rounded-md animate-pulse mb-6" />
        <div className="h-4 bg-slate-100 w-2/3 mx-auto rounded-md animate-pulse mb-3" />
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (errorMessage || !event) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-8 bg-white border border-slate-200 rounded-xl">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
          <p className="text-xs text-slate-500 mt-2">
            {errorMessage || 'The requested event does not exist or may have been removed.'}
          </p>
          <Link
            to="/events"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Events Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  const remaining = event.remainingCapacity !== undefined
    ? event.remainingCapacity
    : Math.max(0, event.maxCapacity - (event.confirmedRegistrationsCount || 0));

  const isFull = remaining <= 0;
  const isPastDeadline = new Date() > new Date(event.registrationDeadline);
  const isCancelled = event.status === 'cancelled';
  const isCompleted = event.status === 'completed';
  const isRegistrationOpen =
    (event.status === 'upcoming' || event.status === 'ongoing') && !isFull && !isPastDeadline;

  const percentFilled = event.maxCapacity > 0
    ? Math.min(100, Math.round(((event.confirmedRegistrationsCount || 0) / event.maxCapacity) * 100))
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Events</span>
        </Link>
      </div>

      {/* Hero Banner Header */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {/* Event Media Banner */}
        {event.imageUrl && !imageError && (
          <div className="relative h-64 sm:h-80 w-full bg-slate-950 overflow-hidden">
            <img
              src={event.imageUrl}
              alt={event.title}
              onError={() => setImageError(true)}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          {/* Metadata & Share Action */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>{event.category}</span>
              <span aria-hidden="true">·</span>
              <span>{event.format} Format</span>
              <span aria-hidden="true">·</span>
              <span>{event.timeZone}</span>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Link Copied' : 'Share Event'}</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {event.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            {event.shortDescription}
          </p>

          {/* Schedule & Venue Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Date &amp; Schedule
                </span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {formatEventDateTime(event.startDate, event.timeZone)}
                </p>
                <p className="text-slate-500">to {formatEventDateTime(event.endDate, event.timeZone)}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Venue / Location
                </span>
                <p className="font-semibold text-slate-900 mt-0.5">{event.venue}</p>
                <p className="text-slate-500">{event.format} Delivery</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Registration Cutoff
                </span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {formatEventDateTime(event.registrationDeadline, event.timeZone)}
                </p>
                <p className="text-slate-500">
                  {isPastDeadline ? 'Cutoff expired' : 'Registrations close strictly on schedule'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Syllabus vs Reservation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 Cols): Syllabus & Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Full Description / Overview */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Event Curriculum &amp; Syllabus</span>
            </h2>
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4">
              {event.fullDescription.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Speaker / Instructor Profile */}
          {event.speakerInfo?.name && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>Featured Speaker &amp; Instructor</span>
              </h2>
              <div className="mt-4 flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center font-bold text-base rounded-lg shrink-0">
                  {event.speakerInfo.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{event.speakerInfo.name}</h3>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">
                    {event.speakerInfo.role} {event.speakerInfo.company && `· ${event.speakerInfo.company}`}
                  </p>
                  {event.speakerInfo.bio && (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {event.speakerInfo.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Prerequisites */}
          {event.prerequisites && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Prerequisites &amp; Technical Requirements
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                {event.prerequisites}
              </p>
            </div>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (4 Cols): Live Capacity & Reservation Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs sticky top-24 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Participant Capacity</span>
            </h3>

            {/* Metrics */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Capacity Ceiling:</span>
                <span className="font-semibold text-slate-900 tabular-nums">{event.maxCapacity} seats</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Confirmed Attendees:</span>
                <span className="font-semibold text-slate-900 tabular-nums">{event.confirmedRegistrationsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Available Remaining:</span>
                <span className="font-bold text-slate-900 tabular-nums">{remaining} seats</span>
              </div>

              {/* Meter */}
              <div className="pt-2">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isFull
                        ? 'bg-rose-500'
                        : percentFilled >= 80
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${percentFilled}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-1 tabular-nums">
                  <span>{percentFilled}% filled</span>
                  <span>{event.maxCapacity} max</span>
                </div>
              </div>

              <div className="pt-2">
                <CapacityBadge
                  maxCapacity={event.maxCapacity}
                  confirmedCount={event.confirmedRegistrationsCount}
                  remainingCapacity={remaining}
                  status={event.status}
                  isPastDeadline={isPastDeadline}
                />
              </div>
            </div>

            {/* Registration Action Trigger */}
            <div className="pt-4 border-t border-slate-100">
              {isRegistrationOpen ? (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Reserve Your Seat</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-4 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed text-center"
                  >
                    Registration Closed
                  </button>
                  <p className="text-[11px] text-slate-500 text-center leading-normal">
                    {isCancelled && 'This event has been officially cancelled.'}
                    {isCompleted && 'This event has already concluded.'}
                    {!isCancelled && !isCompleted && isPastDeadline && 'Registration deadline has passed.'}
                    {!isCancelled && !isCompleted && !isPastDeadline && isFull && 'Maximum attendee capacity reached.'}
                  </p>
                </div>
              )}

              <p className="text-[11px] text-slate-400 mt-3 text-center leading-normal">
                Single registration per email address. Concurrency protected.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {isModalOpen && (
        <RegistrationModal
          event={event}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            fetchEvent(true);
          }}
        />
      )}
    </div>
  );
};
