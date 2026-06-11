import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, ClipboardList, ChevronRight, MapPin, Users } from 'lucide-react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import { getGroups, getGroup } from '../../src/services/groupService';
import GroupCard from '../../src/components/GroupCard';
import LoadingState from '../../src/components/LoadingState';
import EmptyState from '../../src/components/EmptyState';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

export default function GroupScreen() {
  const router = useRouter();
  const { profile } = useAuthContext();
  const [groups, setGroups] = useState([]);
  const [myGroup, setMyGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      const all = await getGroups();
      setGroups(all);
      if (profile?.groupId) {
        const mg = await getGroup(profile.groupId);
        setMyGroup(mg);
      }
    } catch (e) { console.warn('Group load error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { loadData(); }, [profile?.groupId]);
  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, []);

  if (loading) return <LoadingState />;

  const isLeader = ['leader', 'coLeader', 'admin'].includes(profile?.role);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Groups</Text>
          {isLeader && (
            <TouchableOpacity onPress={() => router.push('/group/manage')} style={styles.manageBtn}>
              <Settings size={15} color={Colors.primary} />
              <Text style={styles.manageBtnText}>Manage</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* My Group */}
        {myGroup && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MY GROUP</Text>
            <TouchableOpacity
              style={styles.myGroupCard}
              onPress={() => router.push(`/group/${myGroup.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.myGroupInfo}>
                <Text style={styles.myGroupName}>{myGroup.name}</Text>
                {myGroup.location && (
                  <View style={styles.myGroupMeta}>
                    <MapPin size={11} color="rgba(255,255,255,0.75)" />
                    <Text style={styles.myGroupMetaText}>{myGroup.location}</Text>
                  </View>
                )}
                <Text style={styles.myGroupMembers}>
                  {myGroup.memberIds?.length || 0} members
                </Text>
              </View>
              <ChevronRight size={20} color={Colors.white} />
            </TouchableOpacity>

            {isLeader && (
              <TouchableOpacity
                style={styles.requestsBadge}
                onPress={() => router.push('/group/requests')}
              >
                <ClipboardList size={16} color={Colors.primary} />
                <Text style={styles.requestsBadgeText}>View Pending Join Requests</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* All Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ALL GROUPS</Text>
          {groups.length === 0 ? (
            <EmptyState
              IconComponent={Users}
              title="No groups yet"
              subtitle="Groups will appear here once created by your church admin."
            />
          ) : (
            groups.map(g => <GroupCard key={g.id} group={g} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing.base, paddingBottom: Spacing.xxxl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.xl, marginTop: Spacing.sm,
  },
  title: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.text },
  manageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primaryLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  manageBtnText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semiBold },
  section: { marginBottom: Spacing.xl },
  sectionLabel: {
    fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textLight,
    letterSpacing: 1.2, marginBottom: Spacing.sm, textTransform: 'uppercase',
  },
  myGroupCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primary, borderRadius: 16, padding: Spacing.base, gap: Spacing.md,
  },
  myGroupInfo: { flex: 1 },
  myGroupName: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.white, marginBottom: 4 },
  myGroupMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  myGroupMetaText: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.8)' },
  myGroupMembers: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.8)' },
  requestsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surfaceAlt, borderRadius: 10,
    padding: Spacing.md, marginTop: Spacing.sm, justifyContent: 'center',
  },
  requestsBadgeText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.medium },
});
