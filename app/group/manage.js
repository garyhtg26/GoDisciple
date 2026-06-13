import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipboardList, ChevronRight, UserMinus } from 'lucide-react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import { getGroup, updateGroup, kickMember } from '../../src/services/groupService';
import { getUserProfile } from '../../src/services/userService';
import AppHeader from '../../src/components/AppHeader';
import InputField from '../../src/components/InputField';
import PrimaryButton from '../../src/components/PrimaryButton';
import Avatar from '../../src/components/Avatar';
import LoadingState from '../../src/components/LoadingState';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

export default function ManageGroupScreen() {
  const router = useRouter();
  const { user, profile } = useAuthContext();
  const [group, setGroup] = useState(null);
  const [coLeaders, setCoLeaders] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kicking, setKicking] = useState(null); // uid being kicked
  const [form, setForm] = useState({
    name: '', description: '', location: '', ageRange: '', meetingSchedule: '',
  });

  const isLeader = profile?.role === 'leader';

  async function loadMembers(g) {
    const coIds = g.coLeaderIds || [];
    const memberIds = (g.memberIds || []).filter(uid => !coIds.includes(uid) && uid !== g.leaderId);
    const [coProfiles, memberProfiles] = await Promise.all([
      Promise.all(coIds.map(uid => getUserProfile(uid).then(p => p && { ...p, uid }))),
      Promise.all(memberIds.map(uid => getUserProfile(uid).then(p => p && { ...p, uid }))),
    ]);
    setCoLeaders(coProfiles.filter(Boolean));
    setMembers(memberProfiles.filter(Boolean));
  }

  useEffect(() => {
    if (!profile?.groupId) { setLoading(false); return; }
    getGroup(profile.groupId).then(async g => {
      if (g) {
        setGroup(g);
        setForm({
          name: g.name || '', description: g.description || '',
          location: g.location || '', ageRange: g.ageRange || '',
          meetingSchedule: g.meetingSchedule || '',
        });
        await loadMembers(g);
      }
      setLoading(false);
    });
  }, [profile?.groupId]);

  function confirmKick(target, isCoLeader) {
    Alert.alert(
      'Remove from group?',
      `${target.fullName || 'This member'} will be removed from the group${isCoLeader ? ' and lose their co-leader role' : ''}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setKicking(target.uid);
            try {
              await kickMember(profile.groupId, target.uid, { isCoLeader });
              const g = await getGroup(profile.groupId);
              setGroup(g);
              await loadMembers(g);
            } catch (e) {
              Alert.alert('Error', e.message || 'Could not remove member.');
            } finally { setKicking(null); }
          },
        },
      ],
    );
  }

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSave() {
    if (!form.name.trim()) { Alert.alert('Validation', 'Group name is required.'); return; }
    setSaving(true);
    try {
      await updateGroup(profile.groupId, form);
      Alert.alert('Saved', 'Group details updated successfully.');
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save changes.');
    } finally { setSaving(false); }
  }

  if (loading) return <LoadingState />;

  if (!profile?.groupId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader title="Manage Group" showBack />
        <View style={styles.center}>
          <Text style={styles.noGroup}>You are not assigned to a group.</Text>
          <Text style={styles.noGroupSub}>Claim a leader code first from your Profile.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Manage Group" showBack />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Details</Text>
          <InputField label="Group Name" value={form.name} onChangeText={v => set('name', v)} placeholder="Group name" />
          <InputField label="Description" value={form.description} onChangeText={v => set('description', v)} placeholder="What is this group about?" multiline numberOfLines={4} />
          <InputField label="Location" value={form.location} onChangeText={v => set('location', v)} placeholder="e.g. Jakarta Selatan" />
          <InputField label="Age Range" value={form.ageRange} onChangeText={v => set('ageRange', v)} placeholder="e.g. 18-25" />
          <InputField label="Meeting Schedule" value={form.meetingSchedule} onChangeText={v => set('meetingSchedule', v)} placeholder="e.g. Every Saturday, 6:00 PM" />
          <PrimaryButton title="Save Changes" onPress={handleSave} loading={saving} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Management</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/group/requests')}>
            <View style={styles.menuIconWrap}>
              <ClipboardList size={18} color={Colors.primary} />
            </View>
            <Text style={styles.menuItemText}>Pending Join Requests</Text>
            <ChevronRight size={18} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Co-leaders — only the leader can remove them */}
        {coLeaders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Co-Leaders ({coLeaders.length})</Text>
            {coLeaders.map(m => (
              <MemberKickRow
                key={m.uid}
                member={m}
                badge="Co-Leader"
                canKick={isLeader && m.uid !== user?.uid}
                kicking={kicking === m.uid}
                onKick={() => confirmKick(m, true)}
              />
            ))}
          </View>
        )}

        {/* Members — leader and co-leaders can remove */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          {members.length === 0 ? (
            <Text style={styles.emptyText}>No members yet.</Text>
          ) : (
            members.map(m => (
              <MemberKickRow
                key={m.uid}
                member={m}
                canKick={m.uid !== user?.uid}
                kicking={kicking === m.uid}
                onKick={() => confirmKick(m, false)}
              />
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function MemberKickRow({ member, badge, canKick, kicking, onKick }) {
  return (
    <View style={styles.memberRow}>
      <Avatar uri={member.photoURL} name={member.fullName} size={36} />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName} numberOfLines={1}>{member.fullName || member.email}</Text>
        {badge ? (
          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {canKick && (
        <TouchableOpacity
          style={styles.kickBtn}
          onPress={onKick}
          disabled={kicking}
          hitSlop={6}
        >
          <UserMinus size={15} color={kicking ? Colors.textLight : Colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  noGroup: { fontSize: Typography.md, fontWeight: Typography.semiBold, color: Colors.text, textAlign: 'center' },
  noGroupSub: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center' },
  section: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.base,
    marginBottom: Spacing.base,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  sectionTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.base },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.md },
  menuIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  menuItemText: { flex: 1, fontSize: Typography.base, color: Colors.text },
  emptyText: { fontSize: Typography.sm, color: Colors.textLight },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  memberInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  memberName: { fontSize: Typography.sm, color: Colors.text, fontWeight: Typography.medium, flexShrink: 1 },
  memberBadge: { backgroundColor: Colors.primaryLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  memberBadgeText: { fontSize: 10, color: Colors.primary, fontWeight: Typography.bold },
  kickBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FDECEC',
    alignItems: 'center', justifyContent: 'center',
  },
});
