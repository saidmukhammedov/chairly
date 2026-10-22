import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, FontSize, FontWeight, Shadow } from '../constants/theme';
import { MapPin, Star } from 'lucide-react-native';

interface ShopCardProps {
  id: string;
  name: string;
  address: string;
  city: string;
  coverImageUrl?: string | null;
  logoUrl?: string | null;
  startingPrice?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  isFavorited?: boolean;
  isActive?: boolean;
  onPress: () => void;
  onFavoriteToggle?: () => void;
}

export const ShopCard: React.FC<ShopCardProps> = ({
  name,
  address,
  city,
  coverImageUrl,
  startingPrice,
  currency = 'UZS',
  rating,
  reviewCount,
  isFavorited = false,
  onPress,
  onFavoriteToggle,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.container}>
      {/* Cover Image */}
      <View style={styles.imageContainer}>
        {coverImageUrl ? (
          <Image
            source={{ uri: coverImageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.imageFallbackText}>✂</Text>
          </View>
        )}
        {/* Favorite button */}
        {onFavoriteToggle && (
          <TouchableOpacity
            onPress={onFavoriteToggle}
            style={styles.favoriteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 18 }}>{isFavorited ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        )}
        {/* Rating badge */}
        {rating !== undefined && (
          <View style={styles.ratingBadge}>
            <Star size={10} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>
              {rating.toFixed(1)}
            </Text>
            {reviewCount !== undefined && (
              <Text style={styles.reviewCountText}>({reviewCount})</Text>
            )}
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <View style={styles.addressRow}>
          <MapPin size={11} color={Colors.muted} />
          <Text style={styles.address} numberOfLines={1}>
            {address}, {city}
          </Text>
        </View>
        {startingPrice !== undefined && startingPrice > 0 && (
          <Text style={styles.price}>
            From {startingPrice.toLocaleString()} {currency}
          </Text>
        )}
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
    overflow: 'hidden',
    width: 220,
    ...Shadow.md,
  },
  imageContainer: {
    position: 'relative',
    height: 140,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: {
    fontSize: 40,
    color: Colors.muted,
  },
  favoriteBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  ratingText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  reviewCountText: {
    fontSize: FontSize.xs,
    color: Colors.muted,
  },
  info: {
    padding: Spacing.md,
    gap: 4,
  },
  name: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  address: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    flex: 1,
  },
  price: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
    marginTop: 2,
  },
});
