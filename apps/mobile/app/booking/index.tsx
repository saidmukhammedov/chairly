import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  Calendar,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  AlertTriangle,
} from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../src/constants/theme';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/context/AuthContext';
import api, { ApiError } from '../../src/services/api';

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  category: string;
}

interface Barber {
  id: string;
  name: string;
  specialty?: string;
  avatarUrl?: string;
  serviceIds: string[];
}

interface ShopDetails {
  id: string;
  name: string;
  address: string;
  currency: string;
  horizonDays: number;
  services: Service[];
  barbers: Barber[];
}

interface TimeSlot {
  time?: string;
  isoString?: string;
  startTime: string; // ISO
  endTime?: string;   // ISO
  available?: boolean;
  barberId: string;
  barberName: string;
}

export default function BookingScreen() {
  const params = useLocalSearchParams<{
    shopId?: string;
    serviceId?: string;
    barberId?: string;
    rescheduleId?: string;
  }>();

  const { isAuthenticated, user } = useAuth();

  // Wizard state: 1: Service, 2: Barber, 3: Date & Slot, 4: Summary, 5: Confirmed
  const [step, setStep] = useState<number>(1);
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [isLoadingShop, setIsLoadingShop] = useState(true);

  // Selections
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(params.serviceId || null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(params.barberId || 'ANY');
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState<string>('');

  // Slots fetching
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Initialize Date
  useEffect(() => {
    const today = new Date();
    // Default to tomorrow or today
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Fetch Shop
  useEffect(() => {
    if (params.shopId) {
      fetchShop(params.shopId);
    } else {
      // If no shopId provided, pick the first shop
      fetchFirstShop();
    }
  }, [params.shopId]);

  const fetchFirstShop = async () => {
    try {
      const shops = await api.get<any[]>('/shops');
      if (shops && shops.length > 0) {
        fetchShop(shops[0].id);
      }
    } catch {
      setIsLoadingShop(false);
    }
  };

  const fetchShop = async (shopId: string) => {
    setIsLoadingShop(true);
    try {
      const data = await api.get<ShopDetails>(`/shops/${shopId}`);
      setShop(data);

      // If initial service was passed, keep it; otherwise set default if only one
      if (params.serviceId) {
        setSelectedServiceId(params.serviceId);
        setStep(2); // advance to barber step
      }
      if (params.barberId) {
        setSelectedBarberId(params.barberId);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load barbershop details.');
    } finally {
      setIsLoadingShop(false);
    }
  };

  // Fetch Slots whenever shop, service, barber, or date changes
  useEffect(() => {
    if (shop && selectedServiceId && selectedDate) {
      fetchSlots();
    }
  }, [shop, selectedServiceId, selectedBarberId, selectedDate]);

  const fetchSlots = async () => {
    if (!shop || !selectedServiceId || !selectedDate) return;
    setIsLoadingSlots(true);
    setSelectedSlot(null);

    try {
      const barberQuery = selectedBarberId && selectedBarberId !== 'ANY' ? `&barberId=${selectedBarberId}` : '';
      const rawSlots = await api.get<any[]>(
        `/availability?shopId=${shop.id}&serviceId=${selectedServiceId}&date=${selectedDate}${barberQuery}`
      );
      const mapped: TimeSlot[] = (rawSlots || [])
        .filter((s: any) => s.available !== false && (s.startTime || s.isoString))
        .map((s: any) => ({
          time: s.time,
          isoString: s.isoString || s.startTime,
          startTime: s.startTime || s.isoString,
          available: s.available,
          barberId: s.barberId,
          barberName: s.barberName,
        }));
      setAvailableSlots(mapped);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Generate date choices for next 7 days
  const getDateOptions = () => {
    const dates: Array<{ dateStr: string; dayName: string; dayNumber: string; isToday: boolean }> = [];
    const today = new Date();
    const daysToShow = Math.min(shop?.horizonDays || 14, 10);

    for (let i = 0; i < daysToShow; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = String(d.getDate());
      dates.push({ dateStr, dayName, dayNumber, isToday: i === 0 });
    }
    return dates;
  };

  const handleConfirmBooking = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in or create an account to confirm your appointment.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/welcome') },
        ]
      );
      return;
    }

    if (!shop || !selectedServiceId || !selectedSlot) {
      Alert.alert('Incomplete', 'Please ensure all booking details are selected.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (params.rescheduleId) {
        // Reschedule mode
        const res = await api.post<any>(`/appointments/${params.rescheduleId}/reschedule`, {
          newStartTime: selectedSlot.startTime,
          newBarberId: selectedSlot.barberId,
        });
        setConfirmedBooking(res);
        setStep(5);
      } else {
        // New Booking mode
        const res = await api.post<any>('/appointments', {
          shopId: shop.id,
          serviceId: selectedServiceId,
          barberId: selectedSlot.barberId,
          startTime: selectedSlot.startTime,
          notes: notes.trim() || undefined,
        });
        setConfirmedBooking(res);
        setStep(5);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        Alert.alert('Booking Error', err.message);
      } else {
        Alert.alert('Error', 'Slot may no longer be available. Please select another slot.');
        fetchSlots();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingShop || !shop) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Preparing booking schedule...</Text>
      </View>
    );
  }

  const selectedService = shop.services.find((s) => s.id === selectedServiceId);
  const selectedBarber =
    selectedBarberId === 'ANY'
      ? { name: 'Any Available Barber', specialty: 'Fastest availability' }
      : shop.barbers.find((b) => b.id === selectedBarberId);

  // Success Step
  if (step === 5 && confirmedBooking) {
    return (
      <View style={styles.successContainer}>
        <Stack.Screen options={{ headerTitle: 'Confirmed' }} />
        <View style={styles.successIconCircle}>
          <CheckCircle2 size={54} color={Colors.success} />
        </View>
        <Text style={styles.successTitle}>
          {params.rescheduleId ? 'Rescheduled Successfully!' : 'Appointment Confirmed!'}
        </Text>
        <Text style={styles.successSubtitle}>
          We look forward to seeing you at {shop.name}.
        </Text>

        <View style={styles.ticketCard}>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Booking Ref</Text>
            <Text style={styles.ticketRef}>{confirmedBooking.bookingReference}</Text>
          </View>
          <View style={styles.ticketDivider} />
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Barbershop</Text>
            <Text style={styles.ticketVal}>{shop.name}</Text>
          </View>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Service</Text>
            <Text style={styles.ticketVal}>{confirmedBooking.serviceName || selectedService?.name}</Text>
          </View>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Barber</Text>
            <Text style={styles.ticketVal}>{confirmedBooking.barberName || selectedSlot?.barberName}</Text>
          </View>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Time</Text>
            <Text style={styles.ticketVal}>
              {new Date(confirmedBooking.startTime).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}{' '}
              at{' '}
              {new Date(confirmedBooking.startTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </Text>
          </View>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Total Price</Text>
            <Text style={styles.ticketPrice}>
              {(confirmedBooking.servicePrice || selectedService?.price || 0).toLocaleString()} {shop.currency}
            </Text>
          </View>
        </View>

        <View style={styles.successActions}>
          <Button
            title="View My Bookings"
            variant="primary"
            size="lg"
            onPress={() => router.replace('/(tabs)/appointments')}
          />
          <View style={{ height: Spacing.sm }} />
          <Button
            title="Return to Home"
            variant="secondary"
            size="md"
            onPress={() => router.replace('/(tabs)')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: params.rescheduleId ? 'Reschedule Appointment' : 'Book Appointment',
        }}
      />

      {/* Progress Steps Header */}
      <View style={styles.stepProgressBar}>
        {[1, 2, 3, 4].map((s) => (
          <View key={s} style={styles.stepIndicatorWrapper}>
            <View
              style={[
                styles.stepCircle,
                step >= s && styles.stepCircleActive,
                step > s && styles.stepCircleDone,
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  step >= s && styles.stepNumberActive,
                ]}
              >
                {s}
              </Text>
            </View>
            <Text style={[styles.stepTitleLabel, step === s && styles.stepTitleLabelActive]}>
              {s === 1 ? 'Service' : s === 2 ? 'Barber' : s === 3 ? 'Time' : 'Review'}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* STEP 1: SERVICE SELECTION */}
        {step === 1 && (
          <View style={styles.stepSection}>
            <Text style={styles.sectionHeading}>Choose a Service</Text>
            <Text style={styles.sectionSub}>Select the cut, style, or grooming treatment</Text>

            <View style={styles.optionsList}>
              {shop.services.map((service) => {
                const isSelected = selectedServiceId === service.id;
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[styles.cardOption, isSelected && styles.cardOptionSelected]}
                    onPress={() => {
                      setSelectedServiceId(service.id);
                      setStep(2);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                        {service.name}
                      </Text>
                      {service.description ? (
                        <Text style={styles.optionSub}>{service.description}</Text>
                      ) : null}
                      <View style={styles.metaBadge}>
                        <Clock size={12} color={Colors.muted} />
                        <Text style={styles.metaBadgeText}>{service.durationMinutes} mins</Text>
                      </View>
                    </View>
                    <View style={styles.optionRight}>
                      <Text style={styles.priceHighlight}>
                        {service.price.toLocaleString()} {shop.currency}
                      </Text>
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 2: BARBER SELECTION */}
        {step === 2 && (
          <View style={styles.stepSection}>
            <Text style={styles.sectionHeading}>Select a Barber</Text>
            <Text style={styles.sectionSub}>Pick your favourite master or any available barber</Text>

            <View style={styles.optionsList}>
              {/* Option: Any Available */}
              <TouchableOpacity
                style={[
                  styles.cardOption,
                  selectedBarberId === 'ANY' && styles.cardOptionSelected,
                ]}
                onPress={() => {
                  setSelectedBarberId('ANY');
                  setStep(3);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.anyAvatarCircle}>
                  <Sparkles size={22} color={Colors.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={[styles.optionTitle, selectedBarberId === 'ANY' && styles.optionTitleSelected]}>
                    Any Available Barber
                  </Text>
                  <Text style={styles.optionSub}>Fastest available appointment slot</Text>
                </View>
                <ChevronRight size={18} color={Colors.muted} />
              </TouchableOpacity>

              {/* Specific Barbers */}
              {shop.barbers.map((barber) => {
                const isSelected = selectedBarberId === barber.id;
                return (
                  <TouchableOpacity
                    key={barber.id}
                    style={[styles.cardOption, isSelected && styles.cardOptionSelected]}
                    onPress={() => {
                      setSelectedBarberId(barber.id);
                      setStep(3);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.barberAvatarCircle}>
                      <Text style={styles.barberAvatarInitial}>
                        {barber.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                        {barber.name}
                      </Text>
                      <Text style={styles.optionSub}>
                        {barber.specialty || 'Master Barber'}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={Colors.muted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 3: DATE & TIME SLOT SELECTION */}
        {step === 3 && (
          <View style={styles.stepSection}>
            <Text style={styles.sectionHeading}>Pick Date & Time</Text>
            <Text style={styles.sectionSub}>
              Available slots for {selectedService?.name} with {selectedBarber?.name}
            </Text>

            {/* Date Picker Horizontal Pills */}
            <Text style={styles.subHeading}>Select Date</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateList}
            >
              {getDateOptions().map((d) => {
                const isSelected = selectedDate === d.dateStr;
                return (
                  <TouchableOpacity
                    key={d.dateStr}
                    style={[styles.datePill, isSelected && styles.datePillSelected]}
                    onPress={() => setSelectedDate(d.dateStr)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dateDayName, isSelected && styles.dateDayNameSelected]}>
                      {d.dayName}
                    </Text>
                    <Text style={[styles.dateDayNumber, isSelected && styles.dateDayNumberSelected]}>
                      {d.dayNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time Slots */}
            <Text style={[styles.subHeading, { marginTop: Spacing.lg }]}>
              Available Slots ({selectedDate})
            </Text>

            {isLoadingSlots ? (
              <View style={styles.slotsLoading}>
                <ActivityIndicator size="small" color={Colors.accent} />
                <Text style={styles.slotsLoadingText}>Checking live availability...</Text>
              </View>
            ) : availableSlots.length === 0 ? (
              <View style={styles.noSlotsBox}>
                <AlertTriangle size={24} color={Colors.warning} />
                <Text style={styles.noSlotsTitle}>No slots available on this date</Text>
                <Text style={styles.noSlotsText}>
                  Please choose another day or select "Any Available Barber" for more openings.
                </Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {availableSlots.map((slot, index) => {
                  const isSelected =
                    selectedSlot?.startTime === slot.startTime &&
                    selectedSlot?.barberId === slot.barberId;
                  const timeLabel = new Date(slot.startTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  });

                  return (
                    <TouchableOpacity
                      key={`${slot.startTime}-${slot.barberId}-${index}`}
                      style={[styles.slotPill, isSelected && styles.slotPillSelected]}
                      onPress={() => setSelectedSlot(slot)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.slotTimeText, isSelected && styles.slotTimeTextSelected]}>
                        {timeLabel}
                      </Text>
                      {selectedBarberId === 'ANY' && (
                        <Text style={[styles.slotBarberText, isSelected && styles.slotBarberTextSelected]}>
                          {slot.barberName}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* STEP 4: REVIEW & CONFIRM */}
        {step === 4 && (
          <View style={styles.stepSection}>
            <Text style={styles.sectionHeading}>Review Appointment</Text>
            <Text style={styles.sectionSub}>Verify all details before reserving your chair</Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Barbershop</Text>
                <Text style={styles.summaryVal}>{shop.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Address</Text>
                <Text style={styles.summaryVal}>{shop.address}</Text>
              </View>
              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service</Text>
                <Text style={styles.summaryVal}>{selectedService?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryVal}>{selectedService?.durationMinutes} minutes</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Barber</Text>
                <Text style={styles.summaryVal}>{selectedSlot?.barberName || selectedBarber?.name}</Text>
              </View>
              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date & Time</Text>
                <Text style={[styles.summaryVal, { color: Colors.accent, fontWeight: FontWeight.bold }]}>
                  {selectedSlot &&
                    new Date(selectedSlot.startTime).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                  at{' '}
                  {selectedSlot &&
                    new Date(selectedSlot.startTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Due at Shop</Text>
                <Text style={styles.summaryPrice}>
                  {(selectedService?.price || 0).toLocaleString()} {shop.currency}
                </Text>
              </View>
            </View>

            {/* Special Instructions Note Input */}
            <View style={styles.notesSection}>
              <Text style={styles.subHeading}>Notes for Barber (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="e.g. Skin fade with low taper, beard line-up only"
                placeholderTextColor={Colors.placeholder}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.stickyBar}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.backStepBtn}
            onPress={() => setStep(step - 1)}
            disabled={isSubmitting}
          >
            <ChevronLeft size={20} color={Colors.dark} />
            <Text style={styles.backStepText}>Back</Text>
          </TouchableOpacity>
        )}

        <View style={{ flex: 1, marginLeft: step > 1 ? Spacing.md : 0 }}>
          {step === 1 && (
            <Button
              title="Next: Choose Barber"
              variant="primary"
              size="lg"
              onPress={() => setStep(2)}
              disabled={!selectedServiceId}
            />
          )}

          {step === 2 && (
            <Button
              title="Next: Select Time"
              variant="primary"
              size="lg"
              onPress={() => setStep(3)}
              disabled={!selectedBarberId}
            />
          )}

          {step === 3 && (
            <Button
              title="Review Summary"
              variant="primary"
              size="lg"
              onPress={() => setStep(4)}
              disabled={!selectedSlot}
            />
          )}

          {step === 4 && (
            <Button
              title={params.rescheduleId ? 'Confirm Reschedule' : 'Confirm & Reserve Slot'}
              variant="primary"
              size="lg"
              onPress={handleConfirmBooking}
              isLoading={isSubmitting}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.muted,
  },
  stepProgressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepIndicatorWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: Colors.accent,
  },
  stepCircleDone: {
    backgroundColor: Colors.success,
  },
  stepNumber: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.muted,
  },
  stepNumberActive: {
    color: Colors.surface,
  },
  stepTitleLabel: {
    fontSize: 10,
    color: Colors.muted,
  },
  stepTitleLabelActive: {
    color: Colors.dark,
    fontWeight: FontWeight.bold,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: 110,
  },
  stepSection: {
    gap: Spacing.sm,
  },
  sectionHeading: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  sectionSub: {
    fontSize: FontSize.sm,
    color: Colors.muted,
    marginBottom: Spacing.md,
  },
  subHeading: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  optionsList: {
    gap: Spacing.md,
  },
  cardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardOptionSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  optionTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  optionTitleSelected: {
    color: Colors.accent,
  },
  optionSub: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    marginTop: 2,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  metaBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.muted,
  },
  optionRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
    marginLeft: Spacing.md,
  },
  priceHighlight: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
  },
  anyAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barberAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barberAvatarInitial: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.surface,
  },
  dateList: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  datePill: {
    width: 64,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  datePillSelected: {
    backgroundColor: Colors.dark,
    borderColor: Colors.dark,
  },
  dateDayName: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    fontWeight: FontWeight.medium,
  },
  dateDayNameSelected: {
    color: Colors.surface,
  },
  dateDayNumber: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
    marginTop: 2,
  },
  dateDayNumberSelected: {
    color: Colors.surface,
  },
  slotsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    justifyContent: 'center',
  },
  slotsLoadingText: {
    fontSize: FontSize.sm,
    color: Colors.muted,
  },
  noSlotsBox: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  noSlotsTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
    marginTop: Spacing.xs,
  },
  noSlotsText: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  slotPill: {
    width: '31%',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    ...Shadow.sm,
  },
  slotPillSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  slotTimeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  slotTimeTextSelected: {
    color: Colors.surface,
  },
  slotBarberText: {
    fontSize: 10,
    color: Colors.muted,
    marginTop: 2,
  },
  slotBarberTextSelected: {
    color: '#FFE4DB',
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.muted,
  },
  summaryVal: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.dark,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  summaryPrice: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  notesSection: {
    marginTop: Spacing.base,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.dark,
    textAlignVertical: 'top',
    height: 80,
  },
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadow.md,
  },
  backStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  backStepText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.dark,
  },
  successContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  successTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.dark,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.xl,
  },
  ticketCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketLabel: {
    fontSize: FontSize.xs,
    color: Colors.muted,
  },
  ticketRef: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  ticketVal: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.dark,
  },
  ticketPrice: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  ticketDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  successActions: {
    width: '100%',
    marginTop: Spacing.xl,
  },
});
