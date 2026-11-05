import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Clock, CheckCircle2, AlertCircle, XCircle, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

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
    <div className="space-y-3">
      {/* iOS Wheel Drum Container */}
      <div className="relative bg-gradient-to-b from-zinc-50/50 via-white to-zinc-50/50 rounded-2xl border border-zinc-200/90 shadow-sm overflow-hidden select-none">
        {/* Subtle stepper buttons on right for mouse precision */}
        <div className="absolute right-2.5 top-2.5 bottom-2.5 z-25 flex flex-col justify-between pointer-events-auto">
          <button
            type="button"
            onClick={() => stepScroll('up')}
            className="w-7 h-7 rounded-full bg-white/90 hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80 flex items-center justify-center transition-all shadow-xs hover:scale-105 active:scale-95"
            title="Oldingi vaqt"
            aria-label="Oldingi vaqt"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => stepScroll('down')}
            className="w-7 h-7 rounded-full bg-white/90 hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80 flex items-center justify-center transition-all shadow-xs hover:scale-105 active:scale-95"
            title="Keyingi vaqt"
            aria-label="Keyingi vaqt"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Real iOS Center Selection Lens Bar (Frosted glass highlight band) */}
        <div
          className="absolute inset-x-2 pointer-events-none z-10 border-y border-zinc-900/10 bg-zinc-900/[0.03] backdrop-blur-[0.5px] rounded-lg shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
          style={{
            top: PADDING_OFFSET,
            height: ITEM_HEIGHT,
          }}
        />

        {/* Top Vignette Gradient Mask */}
        <div className="pointer-events-none absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-white via-white/85 to-transparent z-15" />

        {/* Bottom Vignette Gradient Mask */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-white via-white/85 to-transparent z-15" />

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
            perspective: '450px',
            transformStyle: 'preserve-3d',
          }}
        >
          {processedSlots.map((slot, index) => {
            const distance = index - centeredIndex;
            const absDistance = Math.abs(distance);
            const isSelected = selectedSlot?.time === slot.time;
            const isCentered = absDistance === 0;

            // Authentic iOS cylindrical curvature rotation
            const rotateX = -distance * 22;
            const scale = isCentered ? 1.08 : Math.max(0.84, 1 - absDistance * 0.08);
            const opacity = isCentered ? 1 : Math.max(0.2, 1 - absDistance * 0.38);

            return (
              <div
                key={slot.isoString || slot.time}
                onClick={() => handleItemClick(slot, index)}
                onMouseEnter={() => setHoveredSlot(slot)}
                onMouseLeave={() => setHoveredSlot(null)}
                style={{
                  height: ITEM_HEIGHT,
                  scrollSnapAlign: 'center',
                  transform: `perspective(450px) rotateX(${rotateX}deg) scale(${scale})`,
                  opacity: slot.isPast ? Math.min(0.35, opacity) : opacity,
                }}
                className={`flex items-center justify-center px-4 transition-all duration-75 cursor-pointer ${
                  slot.isPast
                    ? 'cursor-not-allowed select-none'
                    : 'hover:bg-zinc-100/40 active:scale-95'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Time Digits */}
                  <span
                    className={`font-mono tracking-tight transition-all ${
                      isCentered
                        ? isSelected
                          ? 'text-lg font-black text-zinc-950 scale-105'
                          : 'text-lg font-bold text-zinc-900'
                        : absDistance === 1
                        ? 'text-base font-semibold text-zinc-600'
                        : 'text-sm font-medium text-zinc-400'
                    } ${slot.isPast ? 'line-through text-zinc-400' : ''}`}
                  >
                    {slot.time}
                  </span>

                  {/* Badges for status */}
                  {slot.isPast ? (
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-sm">
                      O'tgan
                    </span>
                  ) : slot.isBooked ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-sm border border-rose-200/80">
                      Band
                    </span>
                  ) : slot.isBreak ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm border border-amber-200/80">
                      Tanaffus
                    </span>
                  ) : isSelected && isCentered ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Tanlandi
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Selected & Hover Preview Bar (Pastdagi nafis ko'rsatkich qism) */}
      <div className="p-3.5 bg-zinc-50/80 border border-zinc-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shrink-0 shadow-2xs">
            <Clock className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                {hoveredSlot ? "Ko'zdan kechirilmoqda" : 'Tanlangan vaqt'}:
              </span>
              <span className="font-mono font-black text-sm sm:text-base text-zinc-950">
                {previewSlot ? previewSlot.time : '—'}
              </span>
            </div>

            <div className="text-[11px] mt-0.5">
              {previewSlot ? (
                previewIsPast ? (
                  <span className="text-zinc-500 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                    Bu vaqt o'tib ketgan. Iltimos, keyingi vaqtni tanlang.
                  </span>
                ) : previewIsBooked ? (
                  <span className="text-rose-600 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Ushbu vaqt band qilingan. Boshqa vaqtni tanlang.
                  </span>
                ) : previewIsBreak ? (
                  <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Usta tanaffusda. Boshqa vaqtni tanlang.
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Bo'sh vaqt — bron qilish uchun tayyor
                    {previewSlot.barberName ? ` (${previewSlot.barberName})` : ''}
                  </span>
                )
              ) : (
                <span className="text-zinc-400">Qulay vaqtni tanlang</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Status Pill */}
        <div className="self-end sm:self-center shrink-0">
          {previewSlot && previewIsSelectable ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-zinc-950 px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-2xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {selectedSlot?.time === previewSlot.time ? 'Tanlandi' : 'Tanlash mumkin'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-zinc-200/80 px-3 py-1.5 rounded-lg uppercase tracking-wider">
              {previewIsPast ? "O'tgan" : 'Band'}
            </span>
          )}
        </div>
      </div>

      {allSlotsPast && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Bugungi barcha vaqtlar o'tib bo'lgan. Iltimos, yuqoridan keyingi kundan birini tanlang.
          </span>
        </div>
      )}
    </div>
  );
};
