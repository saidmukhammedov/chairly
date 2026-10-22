import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Calendar, Plus, Scissors, AlertCircle } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/constants/theme';
import { AppointmentCard } from '../../src/components/AppointmentCard';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

type TabType = 'upcoming' | 'past' | 'cancelled';

interface AppointmentItem {
  id: string;
  bookingReference: string;
  shopId: string;
  shopName: string;
  shopAddress: string;
  barberName: string;
  serviceName: string;
  servicePrice: number;
  currency: string;
  status: string;
  startTime: string;
  endTime: string;
}

export default function AppointmentsScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async (showLoadingIndicator = true) => {
    if (!isAuthenticated) return;
    if (showLoadingIndicator) setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<AppointmentItem[]>(`/appointments/my?statusGroup=${activeTab}`);
      setAppointments(data);
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
      setError('Could not load appointments. Please check your connection.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchAppointments(true);
      }
    }, [isAuthenticated, activeTab])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAppointments(false);
  };

  // Not authenticated screen
  if (!authLoading && !isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bookings</Text>
        </View>
        <View style={styles.unauthContainer}>
          <View style={styles.unauthIconCircle}>
            <Calendar size={36} color={Colors.accent} />
          </View>
          <Text style={styles.unauthTitle}>Sign in to view your bookings</Text>
          <Text style={styles.unauthDesc}>
            Keep track of your haircut schedule, reschedule upcoming visits, or view past receipts.
          </Text>
          <View style={{ width: '100%', maxWidth: 280, marginTop: Spacing.lg }}>
            <Button
              title="Sign In / Register"
              variant="primary"
              size="lg"
              onPress={() => router.push('/(auth)/welcome')}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['upcoming', 'past', 'cancelled'] as TabType[]).map((tab) => {
          const isActive = activeTab === tab;
          const label = tab.charAt(0).toUpperCase() + tab.slice(1);
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {isLoading && !isRefreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <AlertCircle size={36} color={Colors.error} />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <Button
            title="Try Again"
            variant="secondary"
            size="sm"
            onPress={() => fetchAppointments(true)}
          />
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <AppointmentCard
                bookingReference={item.bookingReference}
                shopName={item.shopName}
                shopAddress={item.shopAddress}
                barberName={item.barberName}
                serviceName={item.serviceName}
                servicePrice={item.servicePrice}
                currency={item.currency}
                status={item.status}
                startTime={item.startTime}
                endTime={item.endTime}
                onPress={() => router.push(`/appointment/${item.id}`)}
              />
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Scissors size={32} color={Colors.muted} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'upcoming'
                  ? 'No Upcoming Appointments'
                  : activeTab === 'past'
                  ? 'No Past Bookings'
                  : 'No Cancelled Appointments'}
              </Text>
              <Text style={styles.emptyDesc}>
                {activeTab === 'upcoming'
                  ? 'Ready for a fresh cut or beard trim? Discover great barbershops in your city.'
                  : activeTab === 'past'
                  ? 'Your completed appointments will appear here after your visits.'
                  : 'You have no cancelled appointments.'}
              </Text>
              {activeTab === 'upcoming' && (
                <View style={{ marginTop: Spacing.lg, width: 200 }}>
                  <Button
                    title="Book an Appointment"
                    variant="primary"
                    size="md"
                    onPress={() => router.push('/(tabs)/explore')}
                  />
                </View>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: Colors.dark,
    borderColor: Colors.dark,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.muted,
  },
  activeTabText: {
    color: Colors.surface,
    fontWeight: FontWeight.semibold,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['3xl'],
  },
  cardWrapper: {
    marginBottom: Spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.muted,
  },
  errorTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  errorDesc: {
    fontSize: FontSize.sm,
    color: Colors.muted,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  emptyDesc: {
    fontSize: FontSize.sm,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  unauthContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  unauthIconCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  unauthTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  unauthDesc: {
    fontSize: FontSize.sm,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
