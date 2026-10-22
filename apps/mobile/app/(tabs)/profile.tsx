import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  User,
  Heart,
  Bell,
  Clock,
  Shield,
  LogOut,
  Edit2,
  Check,
  ChevronRight,
  Phone,
  Mail,
} from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../src/constants/theme';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

export default function ProfileScreen() {
  const { user, isAuthenticated, isLoading: authLoading, logout, updateProfile } = useAuth();

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Settings Toggles
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  // Favorites
  const [favoritesCount, setFavoritesCount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      fetchFavoritesCount();
    }
  }, [user]);

  const fetchFavoritesCount = async () => {
    try {
      const res = await api.get<any[]>('/shops/user/favorites');
      setFavoritesCount(res.length);
    } catch {
      // Ignore
    }
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required', 'First and last name are required.');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of Chairly?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  // Guest State
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
        </View>
        <View style={styles.guestContainer}>
          <View style={styles.avatarCircle}>
            <User size={40} color={Colors.muted} />
          </View>
          <Text style={styles.guestTitle}>Welcome to Chairly</Text>
          <Text style={styles.guestDesc}>
            Log in or create an account to view your past cuts, manage bookings, and save your favourite barbershops.
          </Text>
          <View style={{ width: '100%', maxWidth: 280, gap: Spacing.sm, marginTop: Spacing.lg }}>
            <Button
              title="Sign In"
              variant="primary"
              size="lg"
              onPress={() => router.push('/(auth)/login')}
            />
            <Button
              title="Create Account"
              variant="secondary"
              size="lg"
              onPress={() => router.push('/(auth)/register')}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'CH';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
        </View>

        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user.firstName} {user.lastName}
              </Text>
              <Text style={styles.userRole}>Customer Account</Text>
            </View>
            <TouchableOpacity
              style={styles.editToggleBtn}
              onPress={() => {
                if (isEditing) {
                  // Cancel
                  setFirstName(user.firstName || '');
                  setLastName(user.lastName || '');
                  setPhone(user.phone || '');
                  setIsEditing(false);
                } else {
                  setIsEditing(true);
                }
              }}
            >
              <Text style={styles.editToggleText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First Name"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+998 90 123 45 67"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={{ marginTop: Spacing.sm }}>
                <Button
                  title="Save Changes"
                  variant="primary"
                  size="md"
                  onPress={handleSaveProfile}
                  isLoading={isSaving}
                />
              </View>
            </View>
          ) : (
            <View style={styles.profileDetails}>
              <View style={styles.detailRow}>
                <Mail size={16} color={Colors.muted} />
                <Text style={styles.detailText}>{user.email}</Text>
              </View>
              {user.phone ? (
                <View style={styles.detailRow}>
                  <Phone size={16} color={Colors.muted} />
                  <Text style={styles.detailText}>{user.phone}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {/* Shortcuts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Barbershops</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(tabs)/explore')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Heart size={18} color="#15803d" />
                </View>
                <Text style={styles.menuText}>Saved Barbershops</Text>
              </View>
              <View style={styles.menuItemRight}>
                <Text style={styles.badgeText}>{favoritesCount} saved</Text>
                <ChevronRight size={18} color={Colors.muted} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuCard}>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.accentLight }]}>
                  <Bell size={18} color={Colors.accent} />
                </View>
                <View>
                  <Text style={styles.menuText}>Appointment Reminders</Text>
                  <Text style={styles.menuSubText}>Get notifications 2 hours before your slot</Text>
                </View>
              </View>
              <Switch
                value={remindersEnabled}
                onValueChange={setRemindersEnabled}
                trackColor={{ false: Colors.border, true: Colors.accent }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Clock size={18} color="#1D4ED8" />
                </View>
                <View>
                  <Text style={styles.menuText}>Default Timezone</Text>
                  <Text style={styles.menuSubText}>Asia/Tashkent (UTC+5)</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.menuCard}>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#F5F2EB' }]}>
                  <Shield size={18} color={Colors.body} />
                </View>
                <Text style={styles.menuText}>Version</Text>
              </View>
              <Text style={styles.menuSubText}>1.0.0 (Production Build)</Text>
            </View>
          </View>
        </View>

        {/* Log Out Button */}
        <View style={{ marginTop: Spacing.xl, marginBottom: Spacing['3xl'] }}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut size={18} color={Colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
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
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
  header: {
    marginBottom: Spacing.base,
  },
  headerTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
    marginBottom: Spacing.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.surface,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  userRole: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    marginTop: 2,
  },
  editToggleBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.bg,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editToggleText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.dark,
  },
  profileDetails: {
    marginTop: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.body,
  },
  editForm: {
    marginTop: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.muted,
  },
  input: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 42,
    fontSize: FontSize.sm,
    color: Colors.dark,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.dark,
  },
  menuSubText: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    marginTop: 2,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  badgeText: {
    fontSize: FontSize.xs,
    color: Colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 56,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.error,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  guestTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  guestDesc: {
    fontSize: FontSize.sm,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
