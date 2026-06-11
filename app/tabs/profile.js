import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Edit3, Key, Users, ClipboardList, QrCode,
  BookOpen, ChevronRight, LogOut, Settings, Phone,
} from 'lucide-react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import { logout } from '../../src/services/authService';
import Avatar from '../../src/components/Avatar';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

const ROLE_LABEL = {
  member: 'Member',
  leader: 'Group Leader',
  coLeader: 'Co-Leader',
  admin: 'Admin',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile } = useAuthContext();
  const [loggingOut, setLoggingOut] = useState(false);

  const isLeader = ['leader', 'coLeader', 'admin'].includes(profile?.role);

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Profile</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Avatar uri={profile?.photoURL} name={profile?.fullName || user?.email} size={80} />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile?.fullName || 'Go Disciple Member'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {profile?.phone ? (
              <View style={styles.phoneRow}>
                <Phone size={12} color={Colors.textSecondary} />
                <Text style={styles.phone}>{profile.phone}</Text>
              </View>
            ) : null}
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{ROLE_LABEL[profile?.role] || 'Member'}</Text>
            </View>
          </View>
        </View>

        {/* Group badge */}
        {profile?.groupId ? (
          <TouchableOpacity style={styles.groupBadge} onPress={() => router.push(`/group/${profile.groupId}`)}>
            <Text style={styles.groupBadgeLabel}>MY GROUP</Text>
            <View style={styles.groupBadgeLinkRow}>
              <Text style={styles.groupBadgeLink}>View My Group</Text>
              <ChevronRight size={14} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.groupBadge}>
            <Text style={styles.groupBadgeLabel}>GROUP</Text>
            <Text style={styles.groupBadgeNone}>Not in a group yet</Text>
          </View>
        )}

        {/* Account */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon={Edit3} label="Edit Profile" onPress={() => router.push('/profile/edit')} />
          <MenuItem icon={Key} label="Claim Leader Code" onPress={() => router.push('/profile/claim-code')} last />
        </View>

        {/* Management (leader only) */}
        {isLeader && (
          <>
            <Text style={styles.sectionLabel}>MANAGEMENT</Text>
            <View style={styles.menuGroup}>
              <MenuItem icon={Settings} label="Manage Group" onPress={() => router.push('/group/manage')} />
              <MenuItem icon={ClipboardList} label="Pending Join Requests" onPress={() => router.push('/group/requests')} />
              <MenuItem icon={QrCode} label="Attendance Scanner" onPress={() => router.push('/checkin/scanner')} last />
            </View>
          </>
        )}

        {/* Explore */}
        <Text style={styles.sectionLabel}>EXPLORE</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon={BookOpen} label="Bible Themes" onPress={() => router.push('/bible-theme')} />
          <MenuItem icon={QrCode} label="Scan QR Check-in" onPress={() => router.push('/checkin/scanner')} last />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loggingOut}>
          <LogOut size={18} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Go Disciple v1.0.0 · GKDI</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon: Icon, label, onPress, badge, last }) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, last && { borderBottomWidth: 0 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuIconWrap}>
        <Icon size={18} color={Colors.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <ChevronRight size={18} color={Colors.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  screenTitle: {
    fontSize: Typography.xxl, fontWeight: Typography.bold,
    color: Colors.text, marginTop: Spacing.sm, marginBottom: Spacing.xl,
  },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.base,
    backgroundColor: Colors.surface, borderRadius: 20, padding: Spacing.xl,
    marginBottom: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  profileInfo: { flex: 1 },
  name: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.text, marginBottom: 2 },
  email: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: 4 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  phone: { fontSize: Typography.sm, color: Colors.textSecondary },
  roleBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.primaryLight,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  roleText: {
    fontSize: Typography.xs, color: Colors.primary,
    fontWeight: Typography.bold, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  groupBadge: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surfaceAlt, borderRadius: 12,
    padding: Spacing.base, marginBottom: Spacing.xl,
  },
  groupBadgeLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textLight, letterSpacing: 1 },
  groupBadgeLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  groupBadgeLink: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semiBold },
  groupBadgeNone: { fontSize: Typography.sm, color: Colors.textLight },
  sectionLabel: {
    fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textLight,
    letterSpacing: 1.2, marginBottom: Spacing.sm, marginLeft: 4, textTransform: 'uppercase',
  },
  menuGroup: {
    backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden',
    marginBottom: Spacing.xl,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.base, borderBottomWidth: 1,
    borderBottomColor: Colors.divider, gap: Spacing.md,
  },
  menuIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: Typography.base, color: Colors.text },
  badge: {
    backgroundColor: Colors.error, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2, marginRight: 4,
  },
  badgeText: { fontSize: Typography.xs, color: Colors.white, fontWeight: Typography.bold },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.error,
    paddingVertical: Spacing.md, marginBottom: Spacing.xl,
  },
  logoutText: { fontSize: Typography.base, color: Colors.error, fontWeight: Typography.semiBold },
  version: { fontSize: Typography.xs, color: Colors.textLight, textAlign: 'center' },
});
