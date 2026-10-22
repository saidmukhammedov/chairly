import React from 'react';
import { AppointmentStatus } from '@chairly/shared';

const statusConfig: Record<
  AppointmentStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  CONFIRMED: {
    label: 'Confirmed',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  PENDING: {
    label: 'Pending',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  CHECKED_IN: {
    label: 'Checked In',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-chairly-panel border-chairly-border',
    text: 'text-chairly-dark',
    dot: 'bg-chairly-muted',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
  },
  NO_SHOW: {
    label: 'No Show',
    bg: 'bg-neutral-100 border-neutral-300',
    text: 'text-neutral-600',
    dot: 'bg-neutral-400',
  },
};

export const StatusBadge: React.FC<{ status: AppointmentStatus | string }> = ({ status }) => {
  const config = statusConfig[status as AppointmentStatus] || {
    label: status,
    bg: 'bg-gray-100 border-gray-200',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
