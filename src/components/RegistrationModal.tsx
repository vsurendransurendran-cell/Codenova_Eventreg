import React, { useState } from 'react';
import { X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { EventItem } from '../types/index.ts';
import { api } from '../utils/api.ts';
import { validateRegistrationInput } from '../utils/registrationRules.ts';
import { RegistrationSuccess } from './RegistrationSuccess.tsx';

interface RegistrationModalProps {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DOMAIN_OPTIONS = [
  'Frontend Development',
  'Cloud & DevOps',
  'Cybersecurity',
  'AI & Machine Learning',
  'UI/UX Design',
  'Systems & Architecture',
  'Product Management',
];

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [domainInterests, setDomainInterests] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverErrorCode, setServerErrorCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);

  if (!isOpen) return null;

  const toggleDomain = (domain: string) => {
    setDomainInterests((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
    if (fieldErrors.domainInterests) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.domainInterests;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setServerErrorCode(null);

    // 1. Client-side validation check
    const validation = validateRegistrationInput({
      fullName,
      email,
      organization,
      domainInterests,
    });

    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);

    try {
      const res = await api.registerForEvent(event._id, {
        fullName,
        email,
        organization,
        domainInterests,
        notes,
      });

      if (res.success && res.registration) {
        setSuccessData({
          registration: res.registration,
          event: res.event || event,
        });
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error('[Registration submit error]', err);
      const code = err.code || 'UNKNOWN_ERROR';
      setServerErrorCode(code);

      if (code === 'DUPLICATE_REGISTRATION') {
        setServerError('This email address has already been registered for this event. Duplicate submissions are prevented.');
      } else if (code === 'CAPACITY_REACHED') {
        setServerError('This event has reached full capacity. No remaining seats are available.');
      } else if (code === 'REGISTRATION_CLOSED') {
        setServerError('The registration cutoff deadline for this event has passed.');
      } else {
        setServerError(err.message || 'An unexpected error occurred during registration. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transition-all my-8">
        {/* If registration succeeded, show Ticket Pass */}
        {successData ? (
          <div className="p-6 sm:p-8">
            <RegistrationSuccess
              registration={successData.registration}
              event={successData.event}
              onClose={onClose}
            />
          </div>
        ) : (
          <div>
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
                  Event Registration
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5 leading-snug">
                  {event.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>{event.format}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {event.remainingCapacity ?? Math.max(0, event.maxCapacity - (event.confirmedRegistrationsCount || 0))} seats left
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close registration dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div className="m-6 mb-0 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-900 mb-0.5">
                    {serverErrorCode === 'DUPLICATE_REGISTRATION'
                      ? 'Already Registered'
                      : 'Unable to Complete Registration'}
                  </span>
                  <span>{serverError}</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {/* Full Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maya Lin"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) {
                      setFieldErrors((prev) => {
                        const n = { ...prev };
                        delete n.fullName;
                        return n;
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                    fieldErrors.fullName ? 'border-rose-400 ring-rose-200' : 'border-slate-200'
                  }`}
                />
                {fieldErrors.fullName && (
                  <p className="text-rose-600 text-[11px] mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. maya.lin@university.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => {
                        const n = { ...prev };
                        delete n.email;
                        return n;
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                    fieldErrors.email ? 'border-rose-400 ring-rose-200' : 'border-slate-200'
                  }`}
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Confirmation and check-in pass will be issued to this email.
                </span>
                {fieldErrors.email && (
                  <p className="text-rose-600 text-[11px] mt-0.5">{fieldErrors.email}</p>
                )}
              </div>

              {/* Organization */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Affiliation / Organization <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Polytechnic Institute or Company"
                  value={organization}
                  onChange={(e) => {
                    setOrganization(e.target.value);
                    if (fieldErrors.organization) {
                      setFieldErrors((prev) => {
                        const n = { ...prev };
                        delete n.organization;
                        return n;
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                    fieldErrors.organization ? 'border-rose-400 ring-rose-200' : 'border-slate-200'
                  }`}
                />
                {fieldErrors.organization && (
                  <p className="text-rose-600 text-[11px] mt-1">{fieldErrors.organization}</p>
                )}
              </div>

              {/* Domain Interests */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Technical Interests <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DOMAIN_OPTIONS.map((domain) => {
                    const isSelected = domainInterests.includes(domain);
                    return (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => toggleDomain(domain)}
                        className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                          isSelected
                            ? 'bg-slate-900 border-slate-900 text-white font-medium'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {domain}
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.domainInterests && (
                  <p className="text-rose-600 text-[11px] mt-1.5">{fieldErrors.domainInterests}</p>
                )}
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Special Accommodations or Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Dietary preferences, accessibility needs, or team notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Seat...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Registration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
