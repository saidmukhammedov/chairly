import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Scissors,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../src/constants/theme';
import { Button } from '../../src/components/ui/Button';
import api, { ApiError } from '../../src/services/api';

interface StatusHistoryItem {
  id: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  createdAt: string;
  changedBy?: {
    firstName: string;
    lastName: string;
  };
}

interface AppointmentDetails {
  id: string;
  bookingReference: string;
  shopId: string;
  shopName: string;
  shopAddress: string;
  shopPhone?: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  currency: string;
  status: string;
  startTime: string;
  endTime: string;
  notes?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  statusHistory?: StatusHistoryItem[];
  shop?: {
    cancelDeadlineHours?: number;
  };
}

const statusBadgeStyles: Record<string, { label: string; bg: string; text: string; border: string }> = {
  CONFIRMED: { label: 'Confirmed', bg: '#F0FDF4', text: '#15803d', border: '#BBF7D0' },
  PENDING: { label: 'Pending Confirmation', bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  CHECKED_IN: { label: 'Checked In', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  IN_PROGRESS: { label: 'In Chair', bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  COMPLETED: { label: 'Completed', bg: '#F5F2EB', text: '#57534E', border: '#E7E5E4' },
  CANCELLED: { label: 'Cancelled', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  NO_SHOW: { label: 'No Show', bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' },
};

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<AppointmentDetails>(`/appointments/${id}`);
      setAppointment(data);
    } catch (err: any) {
      Alert.alert('Error', 'Could not load appointment details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this booking? This will immediately reopen the slot for other customers.',
      [
        { text: 'Keep Appointment', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: performCancel,
        },
      ]
    );
  };

  const performCancel = async () => {
    if (!id) return;
    setIsCancelling(true);
    try {
      await api.post(`/appointments/${id}/cancel`, {
        reason: 'Customer cancelled via mobile app',
      });
      Alert.alert('Cancelled', 'Your appointment has been cancelled.');
      fetchDetails();
    } catch (err: any) {
      if (err instanceof ApiError) {
        Alert.alert('Cancellation Policy', err.message);
      } else {
        Alert.alert('Error', 'Unable to cancel appointment. Please contact the barbershop.');
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReschedule = () => {
    if (!appointment) return;
    router.push({
      pathname: '/booking',
      params: {
        shopId: appointment.shopId,
        serviceId: appointment.serviceId,
        barberId: appointment.barberId,
        rescheduleId: appointment.id,
      },
    });
  };

  if (isLoading || !appointment) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  const badge = statusBadgeStyles[appointment.status] || statusBadgeStyles.CONFIRMED;
  const isCancellable = appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';

  const startDate = new Date(appointment.startTime);
  const endDate = new Date(appointment.endTime);

  const formattedDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = `${startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })} – ${endDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })}`;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Appointment Details',
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card Banner */}
        <View style={[styles.statusCard, { backgroundColor: badge.bg, borderColor: badge.border }]}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusLabelSmall}>STATUS</Text>
              <Text style={[styles.statusTitle, { color: badge.text }]}>{badge.label}</Text>
            </View>
            <View style={styles.refContainer}>
              <Text style={styles.refLabel}>Booking Reference</Text>
              <Text style={styles.refCode}>{appointment.bookingReference}</Text>
            </View>
          </View>
        </View>

        {/* Date & Time Highlights Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Calendar size={18} color={Colors.accent} />
            <Text style={styles.cardHeaderTitle}>Date & Time</Text>
          </View>
          <Text style={styles.dateTimeLarge}>{formattedDate}</Text>
          <Text style={styles.timeHighlight}>{formattedTime}</Text>
          <View style={styles.durationRow}>
            <Clock size={14} color={Colors.muted} />
            <Text style={styles.durationText}>
              Duration: {appointment.serviceDuration} minutes
            </Text>
          </View>
        </View>

        {/* Barbershop & Barber Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Scissors size={18} color={Colors.accent} />
            <Text style={styles.cardHeaderTitle}>Service & Specialist</Text>
          </View>

          <View style={styles.itemRow}>
            <View>
              <Text style={styles.itemTitle}>{appointment.serviceName}</Text>
              <Text style={styles.itemSub}>Master Grooming Service</Text>
            </View>
            <Text style={styles.priceText}>
              {appointment.servicePrice.toLocaleString()} {appointment.currency}
            </Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.barberRow}>
            <View style={styles.barberAvatar}>
              <User size={18} color={Colors.accent} />
            </View>
            <View>
              <Text style={styles.barberName}>{appointment.barberName}</Text>
              <Text style={styles.barberRole}>Assigned Barber</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.shopLocationRow}>
            <MapPin size={16} color={Colors.muted} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.shopNameText}>{appointment.shopName}</Text>
              <Text style={styles.shopAddressText}>{appointment.shopAddress}</Text>
            </View>
          </View>

          {appointment.shopPhone ? (
            <View style={styles.phoneRow}>
              <Phone size={14} color={Colors.accent} />
              <Text style={styles.phoneText}>{appointment.shopPhone}</Text>
            </View>
          ) : null}
        </View>

        {/* Customer Notes */}
        {appointment.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Your Notes to Barber</Text>
            <Text style={styles.notesText}>{appointment.notes}</Text>
          </View>
        ) : null}

        {/* Cancellation Information if Cancelled */}
        {appointment.status === 'CANCELLED' && (
          <View style={[styles.card, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <XCircle size={18} color={Colors.error} />
              <Text style={[styles.cardHeaderTitle, { color: Colors.error }]}>
                Cancellation Details
              </Text>
            </View>
            {appointment.cancelledAt ? (
              <Text style={styles.cancellationMeta}>
                Cancelled on {new Date(appointment.cancelledAt).toLocaleString()}
              </Text>
            ) : null}
            {appointment.cancellationReason ? (
              <Text style={styles.cancellationReason}>
                Reason: {appointment.cancellationReason}
              </Text>
            ) : null}
          </View>
        )}

        {/* Action Buttons */}
        {isCancellable && (
          <View style={styles.actionsSection}>
            <Button
              title="Reschedule Appointment"
              variant="secondary"
              size="lg"
              onPress={handleReschedule}
            />
            <View style={{ height: Spacing.sm }} />
            <Button
              title="Cancel Appointment"
              variant="danger"
              size="lg"
              onPress={handleCancel}
              isLoading={isCancelling}
            />
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.md,
  },
  statusCard: {
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    ...Shadow.sm,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabelSmall: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.muted,
    letterSpacing: 0.8,
  },
  statusTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  refContainer: {
    alignItems: 'flex-end',
  },
  refLabel: {
    fontSize: FontSize.xs,
    color: Colors.muted,
  },
  refCode: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
    gap: Spacing.xs,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  cardHeaderTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  dateTimeLarge: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  timeHighlight: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  durationText: {
    fontSize: FontSize.xs,
    color: Colors.muted,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  itemTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  itemSub: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    marginTop: 2,
  },
  priceText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  barberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  barberAvatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barberName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  barberRole: {
    fontSize: FontSize.xs,
    color: Colors.muted,
  },
  shopLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  shopNameText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  shopAddressText: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    marginTop: 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  phoneText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: FontWeight.medium,
  },
  notesText: {
    fontSize: FontSize.sm,
    color: Colors.body,
    lineHeight: 20,
    marginTop: 4,
  },
  cancellationMeta: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: 4,
  },
  cancellationReason: {
    fontSize: FontSize.sm,
    color: Colors.dark,
    marginTop: 2,
  },
  actionsSection: {
    marginTop: Spacing.md,
  },
});
