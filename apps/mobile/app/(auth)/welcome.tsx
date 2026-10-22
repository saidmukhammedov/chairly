import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Scissors, Calendar, UserCheck, ShieldCheck } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/constants/theme';
import { Button } from '../../src/components/ui/Button';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Brand Header */}
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Scissors size={38} color={Colors.accent} />
          </View>
          <Text style={styles.brandTitle}>Chairly</Text>
          <Text style={styles.tagline}>
            Your next great haircut, one tap away.
          </Text>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Calendar size={20} color={Colors.accent} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Instant Booking</Text>
              <Text style={styles.featureDesc}>
                Browse verified barbershops and lock in your slot in real-time.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <UserCheck size={20} color={Colors.accent} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Choose Your Barber</Text>
              <Text style={styles.featureDesc}>
                Select your preferred barber or choose the next available specialist.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <ShieldCheck size={20} color={Colors.accent} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Reliable Schedules</Text>
              <Text style={styles.featureDesc}>
                Guaranteed time slots with transparent pricing and no double bookings.
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Button
            title="Create Account"
            variant="primary"
            size="lg"
            onPress={() => router.push('/(auth)/register')}
          />
          <View style={{ height: Spacing.sm }} />
          <Button
            title="Sign In"
            variant="secondary"
            size="lg"
            onPress={() => router.push('/(auth)/login')}
          />
          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.guestText}>Browse Barbershops as Guest</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: Radius['2xl'],
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  brandTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: Colors.dark,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  featuresSection: {
    marginVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  featureIconContainer: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.dark,
  },
  featureDesc: {
    fontSize: FontSize.sm,
    color: Colors.muted,
    marginTop: 2,
    lineHeight: 18,
  },
  actionsSection: {
    marginTop: Spacing.lg,
  },
  guestButton: {
    marginTop: Spacing.md,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  guestText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.muted,
    textDecorationLine: 'underline',
  },
});
