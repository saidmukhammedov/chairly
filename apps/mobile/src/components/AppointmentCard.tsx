import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, FontSize, FontWeight, Shadow } from '../constants/theme';
import { AppointmentStatus } from '@chairly/shared';

interface AppointmentCardProps {
  bookingReference: string;
  shopName: string;
  shopAddress: string;
  barberName: string;
  serviceName: string;
  servicePrice: number;
  currency: string;
  status: AppointmentStatus | string;
  startTime: string;
  endTime: string;
  onPress?: () => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMED: { label: 'Confirmed', color: '#15803d', bg: '#F0FDF4' },
  PENDING: { label: 'Pending', color: '#B45309', bg: '#FFFBEB' },
  CHECKED_IN: { label: 'Checked In', color: '#1D4ED8', bg: '#EFF6FF' },
  IN_PROGRESS: { label: 'In Progress', color: '#7C3AED', bg: '#F5F3FF' },
  COMPLETED: { label: 'Completed', color: '#6B665E', bg: '#F5F2EB' },
  CANCELLED: { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2' },
  NO_SHOW: { label: 'No Show', color: '#6B7280', bg: '#F9FAFB' },
};

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  bookingReference,
  shopName,
  shopAddress,
  barberName,
  serviceName,
  servicePrice,
  currency,
  status,
  startTime,
  endTime,
  onPress,
}) => {
  const statusInfo = statusConfig[status] || statusConfig.CONFIRMED;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.container}>
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.refBadge}>
          <Text style={styles.refText}>{bookingReference}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>
      </View>

      {/* Shop & Service */}
      <Text style={styles.shopName} numberOfLines={1}>{shopName}</Text>
      <Text style={styles.address} numberOfLines={1}>{shopAddress}</Text>

      <View style={styles.divider} />

      {/* Details Row */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Service</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{serviceName}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Barber</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{barberName}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.dateText}>{formatDate(startTime)}</Text>
          <Text style={styles.timeText}>
            {formatTime(startTime)} – {formatTime(endTime)}
          </Text>
        </View>
        <Text style={styles.priceText}>
          {servicePrice.toLocaleString()} {currency}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  refBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  refText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  shopName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
    marginBottom: 2,
  },
  address: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.dark,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.dark,
  },
  timeText: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    marginTop: 1,
  },
  priceText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
});
