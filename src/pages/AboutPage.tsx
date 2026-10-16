import React from 'react';
import {
  Database,
  Layers,
  Cpu,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-slate-900">
      {/* Title & Introduction */}
      <div className="border-b border-slate-200 pb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Architecture &amp; System Specifications
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
          EVENTFLOW System Architecture
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Production-grade Event Registration and Real-Time Capacity Management
        </p>
      </div>

      {/* Executive Summary */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>1. Architecture &amp; Engineering Overview</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          EVENTFLOW is engineered as a full-stack web application designed for campus hackathons, technical symposia, and executive masterclasses. The platform guarantees strict capacity boundaries and zero overbooking through database-level atomic incrementation, while enforcing participant uniqueness via normalized compound indexing.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-900 block">Frontend Stack</span>
            <span className="text-slate-500 mt-1 block">React 19, TypeScript, Tailwind CSS, React Router v7</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-900 block">Backend Engine</span>
            <span className="text-slate-500 mt-1 block">Node.js, Express.js, RESTful APIs, Centralized Error Handling</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-900 block">Data &amp; Integrity</span>
            <span className="text-slate-500 mt-1 block">MongoDB &amp; Mongoose, Compound Unique Indexes, Atomic Updates</span>
          </div>
        </div>
      </section>

      {/* Key Architectural Guarantees */}
      <section className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900">
          2. Mandatory Implementation Guarantees
        </h2>

        {/* Compound Index & Duplicate Prevention */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900">
                A. Database-Level Duplicate Registration Prevention
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rather than relying solely on client-side state or vulnerable check-then-insert queries, the Mongoose schema establishes a strict compound unique index:
              </p>
              <pre className="p-3 bg-slate-950 text-blue-400 font-mono text-[11px] rounded-lg overflow-x-auto">
{`RegistrationSchema.index(
  { eventId: 1, normalizedEmail: 1 }, 
  { unique: true }
);`}
              </pre>
              <p className="text-xs text-slate-600 leading-relaxed">
                Before reaching the database, participant emails are normalized (trimmed and lowercased). If a concurrent attempt violates uniqueness, MongoDB rejects it with error code <code className="text-slate-900 font-semibold">11000</code>, which our centralized error middleware translates to <code className="text-slate-900 font-semibold">HTTP 409 Conflict</code>:
              </p>
              <pre className="p-3 bg-slate-950 text-slate-300 font-mono text-[11px] rounded-lg overflow-x-auto">
{`{
  "success": false,
  "error": {
    "code": "DUPLICATE_REGISTRATION",
    "message": "This email address is already registered for this event."
  }
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Race Condition Safety */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900">
                B. Race-Condition-Safe Capacity Management
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When multiple participants submit registration for the final seat simultaneously, standard application-level counters fail. EVENTFLOW executes atomic test-and-increment operations directly in MongoDB:
              </p>
              <pre className="p-3 bg-slate-950 text-blue-400 font-mono text-[11px] rounded-lg overflow-x-auto">
{`const updatedEvent = await Event.findOneAndUpdate(
  {
    _id: eventId,
    status: { $in: ['upcoming', 'ongoing'] },
    registrationDeadline: { $gte: new Date() },
    $expr: { $lt: ['$confirmedRegistrationsCount', '$maxCapacity'] }
  },
  { $inc: { confirmedRegistrationsCount: 1 } },
  { new: true }
);`}
              </pre>
              <p className="text-xs text-slate-600 leading-relaxed">
                Only the request that successfully reserves capacity can insert the participant document. If document creation fails or triggers a duplicate index violation, the capacity increment is immediately and atomically rolled back with <code className="text-slate-900 font-semibold">$inc: {'{ confirmedRegistrationsCount: -1 }'}</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Admin Authentication & Security */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                C. Secure Administrator Authentication &amp; Session Isolation
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Administrative endpoints are guarded by server-side verification:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc list-inside">
                <li>Passwords hashed with <strong>bcrypt</strong> (10 salt rounds); password hashes never returned in API payloads.</li>
                <li>Session tokens signed via JWT and stored in <strong>HTTP-only, SameSite='lax' cookies</strong> to mitigate XSS extraction.</li>
                <li>Live database statistics aggregated in real time across events, confirmed participants, and remaining quotas.</li>
                <li>Capacity edit safety: administrators cannot reduce an event's capacity below the number of already-confirmed attendees.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Demo Credentials */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Administrator Evaluation Access
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Pre-provisioned administrative credentials for evaluating platform management:
        </p>
        <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-slate-400">Email:</span> <strong className="text-slate-900 font-semibold">admin@eventflow.dev</strong>
          </div>
          <div>
            <span className="text-slate-400">Password:</span> <strong className="text-slate-900 font-semibold">AdminPass123!</strong>
          </div>
          <Link
            to="/admin/login"
            className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg font-sans text-xs font-semibold text-center hover:bg-slate-800 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <span>Admin Sign-In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
};
