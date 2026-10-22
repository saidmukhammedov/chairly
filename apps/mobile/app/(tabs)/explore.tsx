import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, SlidersHorizontal, Scissors } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/constants/theme';
import { ShopCard } from '../../src/components/ShopCard';
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
}

export default function ExploreScreen() {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [shops, setShops] = useState<ShopSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchShops();
    }, 350);
    return () => clearTimeout(delayDebounce);
  }, [query]);

  const fetchShops = async () => {
    setIsLoading(true);
    try {
      const params = query ? `?search=${encodeURIComponent(query)}` : '';
      const res = await api.get<ShopSummary[]>(`/shops${params}`);
      setShops(res);
    } catch (err) {
      console.error('Explore load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoriteToggle = async (shopId: string) => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    try {
      await api.post(`/shops/${shopId}/favorite`);
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, isFavorited: !s.isFavorited } : s));
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Discover barbershops near you</Text>
        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={16} color={Colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or location..."
              placeholderTextColor={Colors.placeholder}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Scissors size={40} color={Colors.subtle} />
              <Text style={styles.emptyTitle}>No barbershops found</Text>
              <Text style={styles.emptyText}>
                {query ? `No results for "${query}"` : 'Pull down to refresh the listing.'}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ShopCard
                {...item}
                onPress={() => router.push(`/shop/${item.id}`)}
                onFavoriteToggle={() => handleFavoriteToggle(item.id)}
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.bg,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.muted,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  searchRow: { flexDirection: 'row', gap: Spacing.sm },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.dark,
    padding: 0,
  },
  clearBtn: { fontSize: FontSize.sm, color: Colors.muted, paddingHorizontal: 4 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingText: { fontSize: FontSize.sm, color: Colors.muted },
  grid: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing['2xl'] },
  gridRow: { gap: Spacing.md, marginBottom: Spacing.md, justifyContent: 'space-between' },
  gridItem: { flex: 1, maxWidth: '48%' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['5xl'],
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
