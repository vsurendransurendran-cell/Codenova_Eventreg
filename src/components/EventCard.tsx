import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { EventItem } from '../types/index.ts';
import { CapacityBadge } from './CapacityBadge.tsx';
import { formatEventDateTime } from '../utils/registrationRules.ts';

interface EventCardProps {
  event: EventItem;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const [imageError, setImageError] = useState(false);

  const remaining = event.remainingCapacity !== undefined
    ? event.remainingCapacity
    : Math.max(0, event.maxCapacity - (event.confirmedRegistrationsCount || 0));

  const isFull = remaining <= 0;
  const isPastDeadline = new Date() > new Date(event.registrationDeadline);
  const isRegistrationOpen =
    (event.status === 'upcoming' || event.status === 'ongoing') && !isFull && !isPastDeadline;

  const percentFilled = event.maxCapacity > 0
    ? Math.min(100, Math.round(((event.confirmedRegistrationsCount || 0) / event.maxCapacity) * 100))
    : 0;

  return (
    <article className="group bg-white border border-slate-200/90 rounded-xl flex flex-col justify-between overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200">
      {/* Top Banner / Image with Zero-Broken-Image Fallback */}
      <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
        {event.imageUrl && !imageError ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white text-center">
            <Calendar className="w-8 h-8 text-blue-400 mb-2 opacity-80" />
            <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
              {event.category}
            </span>
          </div>
        )}

        {/* Subtle Dark Gradient Scrim at Bottom of Image for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

        {/* Quiet Meta Line Over Scrim */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90">
          <div className="flex items-center gap-1.5 font-medium drop-shadow-sm">
            <span>{event.category}</span>
            <span aria-hidden="true">·</span>
            <span>{event.format}</span>
          </div>
          {event.status === 'cancelled' && (
            <span className="font-semibold text-rose-300 text-[11px] uppercase tracking-wider">
              Cancelled
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
          <Link to={`/events/${event._id}`}>
            {event.title}
          </Link>
        </h3>

        {/* Summary */}
        <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed flex-1 font-normal">
          {event.shortDescription}
        </p>

        {/* Schedule & Venue Metadata */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-800">
              {formatEventDateTime(event.startDate, event.timeZone)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>

        {/* Real-time Capacity Progress Bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <CapacityBadge
              maxCapacity={event.maxCapacity}
              confirmedCount={event.confirmedRegistrationsCount}
              remainingCapacity={remaining}
              status={event.status}
              isPastDeadline={isPastDeadline}
              size="sm"
            />
            <span className="font-medium text-slate-500 tabular-nums text-[11px]">
              {percentFilled}% filled
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isFull
                  ? 'bg-rose-500'
                  : percentFilled >= 80
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${percentFilled}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {isRegistrationOpen ? (
            <span className="text-emerald-700 font-medium inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Registration Open</span>
            </span>
          ) : (
            <span className="text-slate-500 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Closed</span>
            </span>
          )}
        </span>
        <Link
          to={`/events/${event._id}`}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
            isRegistrationOpen
              ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          <span>{isRegistrationOpen ? 'Reserve Seat' : 'View Details'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
};
