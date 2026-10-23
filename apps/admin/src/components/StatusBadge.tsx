import React from 'react';
import { AppointmentStatus } from '@chairly/shared';

const statusConfig: Record<
  AppointmentStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  CONFIRMED: {
    label: 'Tasdiqlangan',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
  },
  PENDING: {
    label: 'Kutilmoqda',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  CHECKED_IN: {
    label: 'Yetib keldi',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    dot: 'bg-blue-500',
  },
  IN_PROGRESS: {
    label: 'Jarayonda',
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-800',
    dot: 'bg-purple-500',
  },
  COMPLETED: {
    label: 'Bajarildi',
    bg: 'bg-zinc-100 border-zinc-200',
    text: 'text-zinc-800',
    dot: 'bg-zinc-500',
  },
  CANCELLED: {
    label: 'Bekor qilindi',
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-800',
    dot: 'bg-rose-500',
  },
  NO_SHOW: {
    label: 'Kelmadi',
    bg: 'bg-zinc-100 border-zinc-300',
    text: 'text-zinc-600',
    dot: 'bg-zinc-400',
  },
};

export const StatusBadge: React.FC<{ status: AppointmentStatus | string }> = ({ status }) => {
  const config = statusConfig[status as AppointmentStatus] || {
    label: status,
    bg: 'bg-zinc-100 border-zinc-200',
    text: 'text-zinc-700',
    dot: 'bg-zinc-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
