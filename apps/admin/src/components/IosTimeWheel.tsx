import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Clock, Check, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';

export interface TimeSlotItem {
  time: string;
  isoString: string;
  startTime?: string;
  available: boolean;
  barberId?: string;
  barberName?: string;
  reason?: string;
  isPast?: boolean;
  isSelectable?: boolean;
  isBooked?: boolean;
  isBreak?: boolean;
}

interface IosTimeWheelProps {
  slots: TimeSlotItem[];
  selectedSlot: TimeSlotItem | null;
  onSelectSlot: (slot: TimeSlotItem) => void;
  selectedDate: string; // "YYYY-MM-DD"
  isLoading?: boolean;
}

const ITEM_HEIGHT = 44; // px per item
const VISIBLE_ITEMS = 5; // 2 above, 1 center, 2 below
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 220px
const PADDING_OFFSET = ITEM_HEIGHT * 2; // 88px top & bottom so first & last items can center

export const IosTimeWheel: React.FC<IosTimeWheelProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
  selectedDate,
  isLoading = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [hoveredSlot, setHoveredSlot] = useState<TimeSlotItem | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<any>(null);

  // Helper to check if slot is in the past
  const isSlotPast = (slot: TimeSlotItem): boolean => {
    if (!slot.available && slot.reason && /past|too late|o'tib/i.test(slot.reason)) {
      return true;
    }
    try {
      const slotTimeStr = slot.isoString || slot.startTime || `${selectedDate}T${slot.time}:00`;
      const slotDate = new Date(slotTimeStr);
      return slotDate.getTime() <= Date.now();
    } catch {
      return false;
    }
  };

  // Process slots with past and booking flags
  const processedSlots = useMemo(() => {
    return slots.map((slot) => {
      const past = isSlotPast(slot);
      const isSelectable = slot.available && !past;
      const isBooked = !slot.available && !past && (!slot.reason || slot.reason === 'BOOKED' || Boolean(slot.reason && /booked|band/i.test(slot.reason)));
      const isBreak = !slot.available && !past && (slot.reason === 'BREAK' || Boolean(slot.reason && /break|tanaffus/i.test(slot.reason)));

      return {
        ...slot,
        isPast: past,
        isSelectable,
        isBooked,
        isBreak,
      };
    });
  }, [slots, selectedDate]);

  // Find first available future slot
  const firstAvailableIndex = useMemo(() => {
    return processedSlots.findIndex((s) => s.isSelectable);
  }, [processedSlots]);

  // Center on initial slot or first available slot
  useEffect(() => {
    if (processedSlots.length === 0 || isLoading) return;

    let targetIndex = -1;
    if (selectedSlot) {
      targetIndex = processedSlots.findIndex(
        (s) => (s.isoString && s.isoString === selectedSlot.isoString) || s.time === selectedSlot.time
      );
    }

    // If no selection or selected slot is in the past or booked, pick first available
    if (targetIndex === -1 || !processedSlots[targetIndex]?.isSelectable) {
      if (firstAvailableIndex !== -1) {
        targetIndex = firstAvailableIndex;
        onSelectSlot(processedSlots[firstAvailableIndex]);
      } else {
        targetIndex = 0;
      }
    }

    if (targetIndex >= 0 && containerRef.current) {
      const targetScroll = targetIndex * ITEM_HEIGHT;
      containerRef.current.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
      setScrollTop(targetScroll);
    }
  }, [selectedDate, processedSlots.length, isLoading]);

  // Handle scroll events with snapping & active detection
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    setScrollTop(currentScrollTop);
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Debounced settle after scroll stops
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      const index = Math.round(currentScrollTop / ITEM_HEIGHT);
      if (index >= 0 && index < processedSlots.length) {
        const candidate = processedSlots[index];
        if (candidate && candidate.isSelectable) {
          onSelectSlot(candidate);
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
          }
        }
      }
    }, 100);
  };

  // Jump by clicking a specific slot
  const handleItemClick = (slot: typeof processedSlots[0], index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'smooth',
      });
    }

    if (slot.isSelectable) {
      onSelectSlot(slot);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }
    }
  };

  // Scroll step up or down
  const stepScroll = (direction: 'up' | 'down') => {
    if (!containerRef.current) return;
    const currentIndex = Math.round(scrollTop / ITEM_HEIGHT);
    const targetIndex = direction === 'up'
      ? Math.max(0, currentIndex - 1)
      : Math.min(processedSlots.length - 1, currentIndex + 1);

    containerRef.current.scrollTo({
      top: targetIndex * ITEM_HEIGHT,
      behavior: 'smooth',
    });
  };

  // Current center slot
  const centeredIndex = Math.round(scrollTop / ITEM_HEIGHT);
  const activeCenteredSlot = processedSlots[centeredIndex] || null;

  // The slot to display in the live preview section (hover takes precedence over center)
  const previewSlot = hoveredSlot || activeCenteredSlot || selectedSlot;
  const previewIsPast = previewSlot ? (previewSlot.isPast ?? isSlotPast(previewSlot)) : false;
  const previewIsBooked = previewSlot ? (previewSlot.isBooked ?? (!previewSlot.available && !previewIsPast)) : false;
  const previewIsBreak = previewSlot ? previewSlot.isBreak : false;
  const previewIsSelectable = previewSlot ? (previewSlot.isSelectable ?? (previewSlot.available && !previewIsPast)) : false;

  if (isLoading) {
    return (
      <div className="h-56 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col items-center justify-center gap-2.5">
        <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-zinc-500">Bo'sh vaqtlar aniqlanmoqda...</span>
      </div>
    );
  }

  if (processedSlots.length === 0) {
    return (
      <div className="h-56 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col items-center justify-center p-6 text-center">
        <Clock className="w-8 h-8 text-zinc-300 mb-2" />
        <p className="text-xs font-bold text-zinc-800">Ushbu kunga bo'sh vaqt yo'q</p>
        <p className="text-[11px] text-zinc-400 mt-1 max-w-xs">
          Sartaroshxona bu kunda ishlamaydi yoki ish vaqtlari mos kelmadi. Boshqa sanani tanlang.
        </p>
      </div>
    );
  }

  const allSlotsPast = processedSlots.every((s) => s.isPast);

  return (
    <div className="space-y-2.5">
      {/* iOS Wheel Drum Container */}
      <div className="relative bg-white rounded-xl border border-zinc-200/90 shadow-xs overflow-hidden select-none">
        {/* Subtle stepper buttons on right for mouse precision */}
        <div className="absolute right-2 top-2 bottom-2 z-25 flex flex-col justify-between pointer-events-auto">
          <button
            type="button"
            onClick={() => stepScroll('up')}
            className="w-6 h-6 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200/80 flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95"
            title="Oldingi vaqt"
            aria-label="Oldingi vaqt"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => stepScroll('down')}
            className="w-6 h-6 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200/80 flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95"
            title="Keyingi vaqt"
            aria-label="Keyingi vaqt"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. CRISP, HIGH-CONTRAST SELECTION FRAME LINES (Doim tiniq va aniq turuvchi chiziqlar) */}
        <div
          className="absolute inset-x-2 pointer-events-none z-10 border-y-[1.5px] border-zinc-900 bg-zinc-950/[0.03] rounded-md"
          style={{
            top: PADDING_OFFSET,
            height: ITEM_HEIGHT,
          }}
        />

        {/* Top Vignette Gradient Mask (reduced height so all items stay clearly visible) */}
        <div className="pointer-events-none absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-white/90 to-transparent z-15" />

        {/* Bottom Vignette Gradient Mask (reduced height so all items stay clearly visible) */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-white/90 to-transparent z-15" />

        {/* Scrollable 3D Tumbler Wheel */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="overflow-y-auto relative scroll-smooth focus:outline-none"
          style={{
            height: CONTAINER_HEIGHT,
            paddingTop: PADDING_OFFSET,
            paddingBottom: PADDING_OFFSET,
            scrollSnapType: 'y mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            perspective: '500px',
            transformStyle: 'preserve-3d',
          }}
        >
          {processedSlots.map((slot, index) => {
            const distance = index - centeredIndex;
            const absDistance = Math.abs(distance);
            const isSelected = selectedSlot?.time === slot.time;
            const isCentered = absDistance === 0;

            // Gentle curvature so numbers remain flat, dark and perfectly legible
            const rotateX = -distance * 12;
            const scale = isCentered ? 1.05 : Math.max(0.92, 1 - absDistance * 0.04);
            const opacity = isCentered ? 1 : absDistance === 1 ? 0.85 : 0.65;

            return (
              <div
                key={slot.isoString || slot.time}
                onClick={() => handleItemClick(slot, index)}
                onMouseEnter={() => setHoveredSlot(slot)}
                onMouseLeave={() => setHoveredSlot(null)}
                style={{
                  height: ITEM_HEIGHT,
                  scrollSnapAlign: 'center',
                  transform: `perspective(500px) rotateX(${rotateX}deg) scale(${scale})`,
                  opacity: slot.isPast ? Math.min(0.4, opacity) : opacity,
                }}
                className={`flex items-center justify-center px-4 transition-all duration-75 cursor-pointer ${
                  slot.isPast
                    ? 'cursor-not-allowed select-none'
                    : 'hover:bg-zinc-50 active:scale-98'
                }`}
              >
                <div className="relative flex items-center justify-center w-full max-w-[240px]">
                  {/* Time Digits (High Contrast & Clear) */}
                  <span
                    className={`font-mono tracking-tight transition-all ${
                      isCentered
                        ? isSelected
                          ? 'text-xl font-black text-zinc-950 scale-105'
                          : 'text-xl font-bold text-zinc-900'
                        : absDistance === 1
                        ? 'text-base font-bold text-zinc-800'
                        : 'text-sm font-semibold text-zinc-600'
                    } ${slot.isPast ? 'line-through text-zinc-400' : ''}`}
                  >
                    {slot.time}
                  </span>

                  {/* 2. STYLISH GREEN TICK MARK (O'ngroqqa joylashtirilgan nishon, hech qanday 'Tanlandi' so'zisiz) */}
                  {isSelected && isCentered && !slot.isPast && slot.available && (
                    <div
                      className="absolute right-4 sm:right-6 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/20"
                      title="Tanlangan"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Other status badges */}
                  {slot.isPast ? (
                    <span className="absolute right-4 text-[9px] font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-sm">
                      O'tgan
                    </span>
                  ) : slot.isBooked ? (
                    <span className="absolute right-4 text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-sm border border-rose-200">
                      Band
                    </span>
                  ) : slot.isBreak ? (
                    <span className="absolute right-4 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm border border-amber-200">
                      Tanaffus
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. COMPACT SELECTED TIME PREVIEW BOX (Kichiklashtirilgan, nafis ma'lumot paneli) */}
      <div className="py-2 px-3 bg-zinc-50 border border-zinc-200/90 rounded-lg flex items-center justify-between gap-2 text-xs shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
          <span className="font-mono font-black text-xs sm:text-sm text-zinc-950 shrink-0">
            {previewSlot ? previewSlot.time : '—'}
          </span>
          <span className="text-zinc-300 hidden sm:inline">•</span>
          <div className="truncate text-[11px]">
            {previewSlot ? (
              previewIsPast ? (
                <span className="text-zinc-500 font-medium">O'tib ketgan vaqt</span>
              ) : previewIsBooked ? (
                <span className="text-rose-600 font-semibold">Ushbu vaqt band</span>
              ) : previewIsBreak ? (
                <span className="text-amber-700 font-semibold">Usta tanaffusda</span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Bo'sh vaqt
                  {previewSlot.barberName ? ` (${previewSlot.barberName})` : ''}
                </span>
              )
            ) : (
              <span className="text-zinc-400">Vaqtni tanlang</span>
            )}
          </div>
        </div>

        {/* Mini Action Status Pill */}
        <div className="shrink-0">
          {previewSlot && previewIsSelectable ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white bg-zinc-950 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-2xs">
              <Check className="w-2.5 h-2.5 stroke-[3] text-emerald-400" />
              Tayyor
            </span>
          ) : (
            <span className="text-[9px] font-semibold text-zinc-500 bg-zinc-200/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
              {previewIsPast ? "O'tgan" : 'Band'}
            </span>
          )}
        </div>
      </div>

      {allSlotsPast && (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Bugungi barcha vaqtlar o'tib bo'lgan. Iltimos, keyingi kundan birini tanlang.
          </span>
        </div>
      )}
    </div>
  );
};
