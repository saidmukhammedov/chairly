import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  MapPin,
  Phone,
  Clock,
  Heart,
  Star,
  ChevronLeft,
  Scissors,
  User,
  CheckCircle,
} from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../src/constants/theme';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

interface WorkingHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

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
  bio?: string;
  avatarUrl?: string;
  specialty?: string;
  serviceIds: string[];
}

interface ShopDetails {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  city: string;
  phone?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  currency: string;
  rating?: number;
  reviewCount?: number;
  isFavorited?: boolean;
  workingHours: WorkingHour[];
  services: Service[];
  barbers: Barber[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ShopDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    if (id) {
      fetchShopDetails();
    }
  }, [id]);

  const fetchShopDetails = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<ShopDetails>(`/shops/${id}`);
      setShop(data);
      setIsFavorited(!!data.isFavorited);
    } catch (err) {
      console.error('Failed to load shop details:', err);
      Alert.alert('Error', 'Barbershop not found or failed to load.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/welcome');
      return;
    }
    try {
      const res = await api.post<{ favorited: boolean }>(`/shops/${id}/favorite`);
      setIsFavorited(res.favorited);
    } catch {
      Alert.alert('Error', 'Could not update favorites.');
    }
  };

  if (isLoading || !shop) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading barbershop...</Text>
      </View>
    );
  }

  const categories = ['All', ...Array.from(new Set(shop.services.map((s) => s.category || 'Other')))];
  const filteredServices =
    activeCategory === 'All'
      ? shop.services
      : shop.services.filter((s) => (s.category || 'Other') === activeCategory);

  const todayDay = new Date().getDay();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Cover Image & Header Controls */}
        <View style={styles.imageContainer}>
          {shop.coverImageUrl ? (
            <Image source={{ uri: shop.coverImageUrl }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Scissors size={48} color={Colors.subtle} />
            </View>
          )}

          {/* Top navigation overlay buttons */}
          <View style={styles.navOverlay}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <ChevronLeft size={22} color={Colors.dark} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.circleBtn, isFavorited && styles.favoritedCircleBtn]}
              onPress={handleToggleFavorite}
              activeOpacity={0.8}
            >
              <Heart
                size={20}
                color={isFavorited ? Colors.error : Colors.dark}
                fill={isFavorited ? Colors.error : 'transparent'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Details Section */}
        <View style={styles.contentBody}>
          {/* Shop Title & Rating */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <View style={styles.locationRow}>
                <MapPin size={15} color={Colors.muted} />
                <Text style={styles.addressText}>
                  {shop.address}, {shop.city}
                </Text>
              </View>
            </View>

            <View style={styles.ratingBadge}>
              <Star size={14} color="#D97706" fill="#D97706" />
              <Text style={styles.ratingScore}>{shop.rating || 4.9}</Text>
              <Text style={styles.reviewCount}>({shop.reviewCount || 48})</Text>
            </View>
          </View>

          {/* Description */}
          {shop.description ? (
            <Text style={styles.descriptionText}>{shop.description}</Text>
          ) : null}

          {/* Contact Row */}
          {shop.phone ? (
            <View style={styles.phoneBadge}>
              <Phone size={14} color={Colors.accent} />
              <Text style={styles.phoneText}>{shop.phone}</Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          {/* Barbers Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Master Barbers</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.barbersList}
            >
              {shop.barbers.map((barber) => (
                <TouchableOpacity
                  key={barber.id}
                  style={styles.barberCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: '/booking',
                      params: { shopId: shop.id, barberId: barber.id },
                    })
                  }
                >
                  <View style={styles.barberAvatar}>
                    {barber.avatarUrl ? (
                      <Image source={{ uri: barber.avatarUrl }} style={styles.barberImage} />
                    ) : (
                      <Text style={styles.barberInitial}>
                        {barber.name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.barberName} numberOfLines={1}>
                    {barber.name}
                  </Text>
                  <Text style={styles.barberSpecialty} numberOfLines={1}>
                    {barber.specialty || 'Master Barber'}
                  </Text>
                  <View style={styles.barberBookTag}>
                    <Text style={styles.barberBookTagText}>Select</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.divider} />

          {/* Services Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Services & Pricing</Text>
            </View>

            {/* Category Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    activeCategory === cat && styles.activeCategoryPill,
                  ]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      activeCategory === cat && styles.activeCategoryPillText,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Services List */}
            <View style={styles.servicesGrid}>
              {filteredServices.map((service) => (
                <View key={service.id} style={styles.serviceItemCard}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    {service.description ? (
                      <Text style={styles.serviceDesc}>{service.description}</Text>
                    ) : null}
                    <View style={styles.serviceMeta}>
                      <Clock size={13} color={Colors.muted} />
                      <Text style={styles.durationText}>{service.durationMinutes} mins</Text>
                    </View>
                  </View>

                  <View style={styles.serviceRight}>
                    <Text style={styles.servicePrice}>
                      {service.price.toLocaleString()} {shop.currency}
                    </Text>
                    <TouchableOpacity
                      style={styles.selectServiceBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/booking',
                          params: { shopId: shop.id, serviceId: service.id },
                        })
                      }
                    >
                      <Text style={styles.selectServiceBtnText}>Book</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Working Hours Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opening Hours</Text>
            <View style={styles.hoursCard}>
              {shop.workingHours.map((wh) => {
                const isToday = wh.dayOfWeek === todayDay;
                return (
                  <View
                    key={wh.dayOfWeek}
                    style={[styles.hoursRow, isToday && styles.todayHoursRow]}
                  >
                    <Text style={[styles.dayLabel, isToday && styles.todayDayLabel]}>
                      {DAYS[wh.dayOfWeek]} {isToday ? '(Today)' : ''}
                    </Text>
                    <Text style={[styles.timeLabel, isToday && styles.todayTimeLabel]}>
                      {wh.isClosed ? 'Closed' : `${wh.openTime} – ${wh.closeTime}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Booking Bar */}
      <View style={styles.stickyFooter}>
        <View style={styles.footerPriceInfo}>
          <Text style={styles.footerStartingAt}>From</Text>
          <Text style={styles.footerPrice}>
            {(shop.services[0]?.price || 0).toLocaleString()} {shop.currency}
          </Text>
        </View>
        <View style={{ flex: 1, maxWidth: 220 }}>
          <Button
            title="Book Appointment"
            variant="primary"
            size="lg"
            onPress={() =>
              router.push({
                pathname: '/booking',
                params: { shopId: shop.id },
              })
            }
          />
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
  scrollContent: {
    paddingBottom: 110,
  },
  imageContainer: {
    width: '100%',
    height: 240,
    backgroundColor: Colors.dark,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EBE6DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navOverlay: {
    position: 'absolute',
    top: 48,
    left: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  favoritedCircleBtn: {
    backgroundColor: '#FFFFFF',
  },
  contentBody: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  shopName: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.dark,
    lineHeight: 30,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  addressText: {
    fontSize: FontSize.sm,
    color: Colors.muted,
    flexShrink: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  ratingScore: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#92400E',
  },
  reviewCount: {
    fontSize: FontSize.xs,
    color: '#B45309',
  },
  descriptionText: {
    fontSize: FontSize.sm,
    color: Colors.body,
    lineHeight: 21,
    marginTop: Spacing.md,
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  phoneText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.md,
  },
  barbersList: {
    gap: Spacing.md,
    paddingRight: Spacing.base,
  },
  barberCard: {
    width: 120,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  barberAvatar: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  barberImage: {
    width: '100%',
    height: '100%',
  },
  barberInitial: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  barberName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
    textAlign: 'center',
  },
  barberSpecialty: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  barberBookTag: {
    backgroundColor: Colors.dark,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  barberBookTagText: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    color: Colors.surface,
  },
  categoriesList: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  categoryPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeCategoryPill: {
    backgroundColor: Colors.dark,
    borderColor: Colors.dark,
  },
  categoryPillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.body,
  },
  activeCategoryPillText: {
    color: Colors.surface,
    fontWeight: FontWeight.semibold,
  },
  servicesGrid: {
    gap: Spacing.sm,
  },
  serviceItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  serviceInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  serviceName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  serviceDesc: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  durationText: {
    fontSize: FontSize.xs,
    color: Colors.muted,
  },
  serviceRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  servicePrice: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  selectServiceBtn: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  selectServiceBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  hoursCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
    gap: Spacing.sm,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  todayHoursRow: {
    backgroundColor: Colors.accentLight,
    marginHorizontal: -Spacing.base,
    paddingHorizontal: Spacing.base,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  dayLabel: {
    fontSize: FontSize.sm,
    color: Colors.muted,
  },
  todayDayLabel: {
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  timeLabel: {
    fontSize: FontSize.sm,
    color: Colors.dark,
    fontWeight: FontWeight.medium,
  },
  todayTimeLabel: {
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  stickyFooter: {
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
    justifyContent: 'space-between',
    ...Shadow.md,
  },
  footerPriceInfo: {
    flex: 1,
  },
  footerStartingAt: {
    fontSize: FontSize.xs,
    color: Colors.muted,
  },
  footerPrice: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
});
