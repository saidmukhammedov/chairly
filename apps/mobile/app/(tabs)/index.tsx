import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, MapPin, Scissors, ChevronRight } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../src/constants/theme';
import { ShopCard } from '../../src/components/ShopCard';
import { AppointmentCard } from '../../src/components/AppointmentCard';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

interface ShopSummary {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  coverImageUrl?: string;
  logoUrl?: string;
  startingPrice?: number;
  currency: string;
  rating?: number;
  reviewCount?: number;
  isFavorited?: boolean;
  isActive: boolean;
}

interface Appointment {
  id: string;
  bookingReference: string;
  shopId: string;
  shopName: string;
  shopAddress: string;
  barberId: string;
  barberName: string;
  customerId: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  currency: string;
  status: string;
  startTime: string;
  endTime: string;
}

const SERVICE_CATEGORIES = ['All', 'Haircut', 'Beard', 'Haircut + Beard', 'Styling', 'Shave & Care'];

export default function HomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const [shops, setShops] = useState<ShopSummary[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const queryParam = selectedCategory !== 'All' ? `?category=${encodeURIComponent(selectedCategory)}` : '';
      const shopsRes = await api.get<ShopSummary[]>(`/shops${queryParam}`);
      setShops(shopsRes);

      // Fetch next upcoming appointment for authenticated users
      if (isAuthenticated) {
        try {
          const apptRes = await api.get<Appointment[]>('/appointments/my?statusGroup=upcoming');
          if (apptRes.length > 0) {
            setNextAppointment(apptRes[0]);
          } else {
            setNextAppointment(null);
          }
        } catch {
          // Non-critical, ignore silently
        }
      }
    } catch (err) {
      console.error('Home screen load error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedCategory, isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFavoriteToggle = async (shopId: string) => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    try {
      await api.post(`/shops/${shopId}/favorite`);
      setShops(prev =>
        prev.map(s => s.id === shopId ? { ...s, isFavorited: !s.isFavorited } : s)
      );
    } catch {}
  };

  const greetingText = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchData(true)}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Greeting Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {greetingText()}{user?.firstName ? `, ${user.firstName}` : ''}
            </Text>
            <Text style={styles.tagline}>Find your perfect cut</Text>
          </View>
          {/* App Wordmark */}
          <View style={styles.wordmark}>
            <View style={styles.wordmarkIcon}>
              <Text style={styles.wordmarkIconText}>C</Text>
            </View>
            <Text style={styles.wordmarkText}>Chairly</Text>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/explore')}
          activeOpacity={0.8}
        >
          <Search size={16} color={Colors.muted} />
          <Text style={styles.searchPlaceholder}>Search barbershops...</Text>
        </TouchableOpacity>

        {/* Next Appointment Banner */}
        {isAuthenticated && nextAppointment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Next Appointment</Text>
            <AppointmentCard
              bookingReference={nextAppointment.bookingReference}
              shopName={nextAppointment.shopName}
              shopAddress={nextAppointment.shopAddress}
              barberName={nextAppointment.barberName}
              serviceName={nextAppointment.serviceName}
              servicePrice={nextAppointment.servicePrice}
              currency={nextAppointment.currency}
              status={nextAppointment.status as any}
              startTime={nextAppointment.startTime}
              endTime={nextAppointment.endTime}
              onPress={() => router.push(`/appointment/${nextAppointment.id}`)}
            />
          </View>
        )}

        {/* Service Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Service</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {SERVICE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured / All Shops */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'All' ? 'Barbershops Near You' : `${selectedCategory} Specialists`}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/explore')}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAllText}>See all</Text>
              <ChevronRight size={14} color={Colors.accent} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingRow}>
              {[1, 2].map(i => (
                <View key={i} style={[styles.skeletonCard]} />
              ))}
            </View>
          ) : shops.length === 0 ? (
            <View style={styles.emptyState}>
              <Scissors size={32} color={Colors.subtle} />
              <Text style={styles.emptyText}>No barbershops found</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shopsRow}
            >
              {shops.slice(0, 6).map(shop => (
                <ShopCard
                  key={shop.id}
                  {...shop}
                  onPress={() => router.push(`/shop/${shop.id}`)}
                  onFavoriteToggle={() => handleFavoriteToggle(shop.id)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Sign In CTA for non-authenticated users */}
        {!isAuthenticated && (
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Ready to book?</Text>
            <Text style={styles.ctaText}>
              Create a free Chairly account to book your favorite barbershop in seconds.
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaButtonText}>Get Started — It's Free</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.base },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.base,
    marginBottom: Spacing.base,
  },
  greeting: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: Colors.muted,
    marginTop: 2,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordmarkIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkIconText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  wordmarkText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.base,
    ...Shadow.sm,
  },
  searchPlaceholder: {
    fontSize: FontSize.base,
    color: Colors.placeholder,
    flex: 1,
  },

  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.sm,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: Spacing.sm,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },

  categoriesRow: { gap: Spacing.sm, paddingRight: Spacing.base },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  categoryChipText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.dark,
  },
  categoryChipTextActive: { color: Colors.white },

  shopsRow: { gap: Spacing.md, paddingRight: Spacing.base },
  loadingRow: { flexDirection: 'row', gap: Spacing.md },
  skeletonCard: {
    width: 220,
    height: 200,
    borderRadius: Radius.xl,
    backgroundColor: Colors.border,
  },

  emptyState: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.sm },
  emptyText: { fontSize: FontSize.sm, color: Colors.muted, fontWeight: FontWeight.medium },

  ctaCard: {
    backgroundColor: Colors.accent,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  ctaTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  ctaText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: Spacing.base,
  },
  ctaButton: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
});
