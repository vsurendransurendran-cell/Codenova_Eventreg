import React from 'react';

interface CapacityBadgeProps {
  maxCapacity: number;
  confirmedCount: number;
  remainingCapacity: number;
  status?: string;
  isPastDeadline?: boolean;
  size?: 'sm' | 'md';
}

export const CapacityBadge: React.FC<CapacityBadgeProps> = ({
  maxCapacity,
  confirmedCount,
  remainingCapacity,
  status = 'upcoming',
  isPastDeadline = false,
  size = 'md',
}) => {
  const isFull = remainingCapacity <= 0;
  const isCancelled = status === 'cancelled';
  const isCompleted = status === 'completed';

  const percent = maxCapacity > 0 ? Math.min(100, Math.round((confirmedCount / maxCapacity) * 100)) : 0;
  const isFillingFast = !isFull && percent >= 80;

  const textSize = size === 'sm' ? 'text-xs' : 'text-xs sm:text-sm';

  if (isCancelled) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium text-rose-700 ${textSize}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
        <span>Event Cancelled</span>
      </span>
    );
  }

  if (isCompleted) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium text-slate-500 ${textSize}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
        <span>Event Concluded</span>
      </span>
    );
  }

  if (isPastDeadline) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium text-amber-700 ${textSize}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        <span>Registration Closed</span>
      </span>
    );
  }

  if (isFull) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold text-rose-700 ${textSize}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
        <span>Full Capacity</span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-500 font-normal">Waitlist only</span>
      </span>
    );
  }

  if (isFillingFast) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold text-amber-700 ${textSize}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        <span>Filling Fast</span>
        <span className="text-slate-400">·</span>
        <span className="tabular-nums font-medium text-slate-600">{remainingCapacity} left</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium text-slate-700 ${textSize}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
      <span className="tabular-nums font-semibold text-slate-900">{remainingCapacity}</span>
      <span className="text-slate-500">of</span>
      <span className="tabular-nums font-semibold text-slate-900">{maxCapacity}</span>
      <span className="text-slate-500">seats available</span>
    </span>
  );
};
