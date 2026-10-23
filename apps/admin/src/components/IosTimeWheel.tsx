import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Clock, CheckCircle2, AlertCircle, XCircle, ChevronUp, ChevronDown } from 'lucide-react';

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
const PADDING_OFFSET = ITEM_HEIGHT * 2; // 88px top & bottom to allow first & last item to center

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
    // If backend already marked unavailable due to past/too late
    if (!slot.available && slot.reason && /past|too late|o'tib/i.test(slot.reason)) {
      return true;
    }
    // Date comparison
    try {
      const slotTimeStr = slot.isoString || slot.startTime || `${selectedDate}T${slot.time}:00`;
      const slotDate = new Date(slotTimeStr);
      return slotDate.getTime() <= Date.now();
    } catch {
      return false;
    }
  };

  // Process slots with past flag
  const processedSlots = useMemo(() => {
    return slots.map((slot) => {
      const past = isSlotPast(slot);
      const isSelectable = slot.available && !past;
      return {
        ...slot,
        isPast: past,
        isSelectable,
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

    // If no selection or selected slot is in the past, pick first available
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
          // Optional subtle haptic
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
          }
        }
      }
    }, 120);
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

  // Scroll one step up or down
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
  const previewIsSelectable = previewSlot ? (previewSlot.isSelectable ?? (previewSlot.available && !previewIsPast)) : false;

  if (isLoading) {
    return (
      <div className="h-56 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-col items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-zinc-500">Vaqtlar hisoblanmoqda...</span>
      </div>
    );
  }

  if (processedSlots.length === 0) {
    return (
      <div className="h-56 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-col items-center justify-center p-6 text-center">
        <Clock className="w-8 h-8 text-zinc-300 mb-2" />
        <p className="text-xs font-semibold text-zinc-700">Ushbu kunga bo'sh vaqt yo'q</p>
        <p className="text-[11px] text-zinc-400 mt-1 max-w-xs">
          Sartaroshxona bu kunda ishlamaydi yoki barcha soatlar band bo'lgan. Boshqa sanani tanlang.
        </p>
      </div>
    );
  }

  const allSlotsPast = processedSlots.every((s) => s.isPast || !s.available);

  return (
    <div className="space-y-3">
      {/* iOS Wheel Drum Container */}
      <div className="relative bg-white rounded-lg border border-zinc-200 shadow-xs overflow-hidden select-none">
        {/* Subtle stepper buttons on right for mouse precision */}
        <div className="absolute right-2 top-2 bottom-2 z-20 flex flex-col justify-between py-1 pointer-events-auto">
          <button
            type="button"
            onClick={() => stepScroll('up')}
            className="w-6 h-6 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-colors shadow-2xs text-xs"
            title="Oldingi vaqt"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => stepScroll('down')}
            className="w-6 h-6 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-colors shadow-2xs text-xs"
            title="Keyingi vaqt"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center Selection Lens Bar (iOS highlight band) */}
        <div
          className="absolute inset-x-0 pointer-events-none z-10 border-y border-zinc-900/10 bg-zinc-50/80 backdrop-blur-[0.5px]"
          style={{
            top: PADDING_OFFSET,
            height: ITEM_HEIGHT,
          }}
        >
          {/* Left subtle indicator notch */}
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-zinc-900" />
        </div>

        {/* Top Vignette Gradient Mask */}
        <div className="pointer-events-none absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-white via-white/80 to-transparent z-15" />

        {/* Bottom Vignette Gradient Mask */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent z-15" />

        {/* Scrollable Tumbler Wheel */}
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
          }}
        >
          {processedSlots.map((slot, index) => {
            const distance = Math.abs(index - centeredIndex);
            const isSelected = selectedSlot?.time === slot.time;
            const isCentered = distance === 0;

            // 3D roller perspective calculation
            const opacity = isCentered ? 1 : Math.max(0.25, 1 - distance * 0.35);
            const scale = isCentered ? 1.05 : Math.max(0.85, 1 - distance * 0.08);
            const translateY = (index - centeredIndex) * 2; // subtle curve

            return (
              <div
                key={slot.isoString || slot.time}
                onClick={() => handleItemClick(slot, index)}
                onMouseEnter={() => setHoveredSlot(slot)}
                onMouseLeave={() => setHoveredSlot(null)}
                style={{
                  height: ITEM_HEIGHT,
                  scrollSnapAlign: 'center',
                  transform: `scale(${scale}) translateY(${translateY}px)`,
                  opacity: slot.isPast ? 0.35 : opacity,
                }}
                className={`flex items-center justify-center px-4 transition-all duration-100 cursor-pointer ${
                  slot.isPast
                    ? 'cursor-not-allowed select-none'
                    : 'hover:bg-zinc-50/40 active:scale-95'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Time Digits */}
                  <span
                    className={`font-mono tracking-tight transition-colors ${
                      isCentered && isSelected
                        ? 'text-base font-black text-zinc-950'
                        : isCentered
                        ? 'text-base font-bold text-zinc-800'
                        : 'text-sm font-medium text-zinc-500'
                    } ${slot.isPast ? 'line-through text-zinc-400' : ''}`}
                  >
                    {slot.time}
                  </span>

                  {/* Badges for status */}
                  {slot.isPast ? (
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-xs">
                      O'tgan
                    </span>
                  ) : !slot.available ? (
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-xs">
                      Band
                    </span>
                  ) : isSelected ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-xs border border-emerald-200">
                      Tanlandi
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Hover & Focus Preview Bar (Pastdagi kichik ko'rsatkich qism) */}
      <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-all">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-white border border-zinc-200 flex items-center justify-center text-zinc-800 shrink-0">
            <Clock className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                {hoveredSlot ? "Ko'zdan kechirilmoqda" : 'Tanlangan vaqt'}:
              </span>
              <span className="font-mono font-black text-sm text-zinc-950">
                {previewSlot ? previewSlot.time : '—'}
              </span>
            </div>

            <div className="text-[11px] text-zinc-500 mt-0.5">
              {previewSlot ? (
                previewIsPast ? (
                  <span className="text-rose-600 font-medium flex items-center gap-1">
                    <XCircle className="w-3 h-3 shrink-0" />
                    Bu vaqt o'tib ketgan. Faqat hozirgi vaqtdan keyingi vaqtni tanlang.
                  </span>
                ) : !previewSlot.available ? (
                  <span className="text-amber-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    Ushbu vaqt band qilingan. Boshqa vaqtni tanlang.
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    Bo'sh vaqt — band qilish uchun tayyor
                    {previewSlot.barberName ? ` (${previewSlot.barberName})` : ''}
                  </span>
                )
              ) : (
                'Vaqt tanlash uchun g‘ildirakni aylantiring'
              )}
            </div>
          </div>
        </div>

        {/* Action / Helper Tag */}
        <div className="self-end sm:self-center shrink-0">
          {previewSlot && previewIsSelectable ? (
            <span className="text-[10px] font-bold text-zinc-900 bg-zinc-200/80 px-2 py-1 rounded-sm uppercase tracking-wider">
              {selectedSlot?.time === previewSlot.time ? 'Aktiv tanlov' : 'Tanlash mumkin'}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-sm uppercase tracking-wider border border-rose-200">
              Tanlab bo'lmaydi
            </span>
          )}
        </div>
      </div>

      {allSlotsPast && (
        <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Bugungi barcha vaqtlar o'tib bo'lgan. Iltimos, keyingi kundan birini tanlang.
          </span>
        </div>
      )}
    </div>
  );
};
