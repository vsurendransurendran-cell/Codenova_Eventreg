import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, Calendar, MapPin, ArrowRight, UserCheck, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatEventDateTime } from '../utils/registrationRules.ts';

interface RegistrationSuccessProps {
  registration: {
    registrationRef: string;
    fullName: string;
    email: string;
    organization: string;
    domainInterests: string[];
    status: string;
    registeredAt: string;
  };
  event: {
    id?: string;
    title: string;
    startDate?: string;
    endDate?: string;
    timeZone?: string;
    venue?: string;
    format?: string;
  };
  onClose?: () => void;
}

export const RegistrationSuccess: React.FC<RegistrationSuccessProps> = ({
  registration,
  event,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(registration.registrationRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white text-slate-900 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 block">
            Registration Confirmed
          </span>
          <h2 className="text-lg font-bold text-slate-900">Your seat is reserved</h2>
        </div>
      </div>

      {/* Digital Attendee Ticket Pass */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
        {/* Ticket Header & Reference */}
        <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-200">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
              Registration Reference
            </span>
            <span className="text-base font-mono font-bold text-slate-900 tracking-wider">
              {registration.registrationRef}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
            title="Copy reference code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Ticket Content */}
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-slate-400 text-[11px] block">Event</span>
            <p className="font-semibold text-slate-900">{event.title}</p>
          </div>

          {event.startDate && (
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{formatEventDateTime(event.startDate, event.timeZone)}</span>
            </div>
          )}

          {event.venue && (
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-slate-600 pt-1">
            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              <strong className="text-slate-900 font-medium">{registration.fullName}</strong> · {registration.organization}
            </span>
          </div>
        </div>

        {/* Simulated Barcode / QR line for authentic check-in badge feel */}
        <div className="pt-3 border-t border-dashed border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-slate-400" />
            <span>Official Digital Pass</span>
          </div>
          <span className="font-mono text-[10px]">EVENTFLOW-{registration.registrationRef.slice(-6)}</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 text-center">
        A confirmation has been logged. Present this reference code upon check-in at the entrance.
      </p>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-1/2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Done
          </button>
        )}
        <Link
          to="/events"
          onClick={onClose}
          className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span>Explore More Events</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
