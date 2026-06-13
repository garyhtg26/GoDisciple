import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, ImageBackground,
  TouchableOpacity, Alert, Linking, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft, MapPin, Users, Instagram, MessageCircle,
  Camera, ImagePlus, CheckCircle,
} from 'lucide-react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import { getGroup, requestJoinGroup, getDiscipleshipRelations, updateGroup } from '../../src/services/groupService';
import { getUserProfile } from '../../src/services/userService';
import { uploadImage } from '../../src/services/imageUploadService';
import Avatar from '../../src/components/Avatar';
import PrimaryButton from '../../src/components/PrimaryButton';
import SecondaryButton from '../../src/components/SecondaryButton';
import LoadingState from '../../src/components/LoadingState';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, profile } = useAuthContext();

  const [group, setGroup] = useState(null);
  const [leader, setLeader] = useState(null);
  const [coLeaders, setCoLeaders] = useState([]);
  const [members, setMembers] = useState([]);
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [uploadingField, setUploadingField] = useState(null); // 'logoURL' | 'coverURL'

  useEffect(() => { loadGroup(); }, [id]);

  async function loadGroup() {
    try {
      const g = await getGroup(id);
      if (!g) { Alert.alert('Not found'); router.back(); return; }
      setGroup(g);

      const [ldr, rels] = await Promise.all([
        g.leaderId ? getUserProfile(g.leaderId) : null,
        getDiscipleshipRelations(id),
      ]);
      setLeader(ldr);
      setRelations(rels);

      const coLdrProfiles = await Promise.all((g.coLeaderIds || []).map(uid => getUserProfile(uid)));
      setCoLeaders(coLdrProfiles.filter(Boolean));

      // leaders/co-leaders are shown in the Leadership card — never as members
      const plainMemberIds = (g.memberIds || []).filter(
        uid => uid !== g.leaderId && !(g.coLeaderIds || []).includes(uid),
      );
      const memberProfiles = await Promise.all(plainMemberIds.slice(0, 20).map(uid => getUserProfile(uid)));
      setMembers(memberProfiles.filter(Boolean));
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }

  // Leader picks a new logo (square) or cover (landscape) → upload → save.
  async function changeGroupImage(field) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: field === 'logoURL' ? [1, 1] : [16, 10],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled) return;
    setUploadingField(field);
    try {
      const url = await uploadImage(result.assets[0].base64);
      await updateGroup(id, { [field]: url });
      setGroup(g => ({ ...g, [field]: url }));
    } catch (e) {
      Alert.alert('Upload failed', e.message || 'Could not update image.');
    } finally { setUploadingField(null); }
  }

  async function handleJoinRequest() {
    if (!user) return;
    setRequesting(true);
    try {
      await requestJoinGroup(id, user.uid);
      Alert.alert('Request Sent', 'Your request to join has been sent. Wait for leader approval.');
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not send request.');
    } finally { setRequesting(false); }
  }

  if (loading) return <LoadingState />;
  if (!group) return null;

  const isMyGroup = profile?.groupId === id;
  const isLeaderHere = profile?.groupId === id && ['leader', 'coLeader'].includes(profile?.role);
  const memberCount = (group.memberIds || []).filter(
    uid => uid !== group.leaderId && !(group.coLeaderIds || []).includes(uid),
  ).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Hero — cover photo background */}
        <ImageBackground
          source={group.coverURL ? { uri: group.coverURL } : null}
          style={styles.hero}
          imageStyle={styles.heroImg}
        >
          <View style={[styles.heroOverlay, !group.coverURL && styles.heroSolid]} />

          {/* Leader: change cover */}
          {isLeaderHere && (
            <TouchableOpacity
              style={styles.coverBtn}
              onPress={() => changeGroupImage('coverURL')}
              disabled={!!uploadingField}
              hitSlop={6}
            >
              {uploadingField === 'coverURL'
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <ImagePlus size={16} color={Colors.white} />}
            </TouchableOpacity>
          )}

          {/* Logo + leader: change logo */}
          <View style={styles.logoWrap}>
            {group.logoURL ? (
              <Image source={{ uri: group.logoURL }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Image source={require('../../assets/logo-white.png')} style={styles.logoFallback} resizeMode="contain" />
              </View>
            )}
            {isLeaderHere && (
              <TouchableOpacity
                style={styles.logoBtn}
                onPress={() => changeGroupImage('logoURL')}
                disabled={!!uploadingField}
                hitSlop={6}
              >
                {uploadingField === 'logoURL'
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <Camera size={13} color={Colors.white} />}
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.groupName}>{group.name}</Text>
          {group.location && (
            <View style={styles.heroMeta}>
              <MapPin size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.groupMeta}>{group.location}</Text>
            </View>
          )}
          {group.ageRange && (
            <View style={styles.heroMeta}>
              <Users size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.groupMeta}>Ages {group.ageRange}</Text>
            </View>
          )}
          <Text style={styles.memberCount}>{memberCount} member{memberCount !== 1 ? 's' : ''}</Text>
        </ImageBackground>

        {group.description ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.cardBody}>{group.description}</Text>
          </View>
        ) : null}

        {group.meetingSchedule ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Meeting Schedule</Text>
            <Text style={styles.cardBody}>{group.meetingSchedule}</Text>
          </View>
        ) : null}

        {/* Leadership */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Leadership</Text>
          {leader && <MemberRow user={leader} badge="Leader" />}
          {coLeaders.map(cl => <MemberRow key={cl.uid} user={cl} badge="Co-Leader" />)}
          {!leader && coLeaders.length === 0 && <Text style={styles.emptyText}>No leaders assigned yet.</Text>}
        </View>

        {/* Members */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Members ({memberCount})</Text>
          {members.slice(0, 10).map(m => <MemberRow key={m.uid} user={m} />)}
          {memberCount > 10 && <Text style={styles.moreMembers}>+{memberCount - 10} more members</Text>}
          {members.length === 0 && <Text style={styles.emptyText}>No members yet.</Text>}
        </View>

        {/* Socials */}
        {group.socials && Object.values(group.socials).some(Boolean) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Social Media</Text>
            <View style={styles.socials}>
              {group.socials.instagram && (
                <TouchableOpacity
                  style={styles.socialBtn}
                  onPress={() => Linking.openURL(`https://instagram.com/${group.socials.instagram}`)}
                >
                  <Instagram size={16} color={Colors.text} />
                  <Text style={styles.socialText}>Instagram</Text>
                </TouchableOpacity>
              )}
              {group.socials.whatsapp && (
                <TouchableOpacity
                  style={styles.socialBtn}
                  onPress={() => Linking.openURL(group.socials.whatsapp)}
                >
                  <MessageCircle size={16} color={Colors.text} />
                  <Text style={styles.socialText}>WhatsApp</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {isMyGroup ? (
            <View style={styles.myGroupBanner}>
              <CheckCircle size={18} color={Colors.white} />
              <Text style={styles.myGroupText}>You are in this group</Text>
            </View>
          ) : (
            <PrimaryButton title="Request to Join" onPress={handleJoinRequest} loading={requesting} />
          )}
          {isLeaderHere && (
            <SecondaryButton title="Manage Group" onPress={() => router.push('/group/manage')} style={{ marginTop: Spacing.sm }} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MemberRow({ user, badge }) {
  return (
    <View style={styles.memberRow}>
      <Avatar uri={user.photoURL} name={user.fullName} size={38} />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{user.fullName}</Text>
        {badge && (
          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.base },
  backText: { fontSize: Typography.base, color: Colors.primary, fontWeight: Typography.medium },
  hero: {
    alignItems: 'center', paddingVertical: Spacing.xl,
    borderRadius: 20, marginBottom: Spacing.base, overflow: 'hidden',
    // black base: shows when there is no cover, while it loads, or if it fails
    backgroundColor: Colors.primaryDark,
  },
  heroImg: { borderRadius: 20, resizeMode: 'cover' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  heroSolid: { backgroundColor: Colors.primaryDark },
  coverBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoWrap: { marginBottom: Spacing.md },
  logo: { width: 80, height: 80, borderRadius: 20, resizeMode: 'cover', backgroundColor: Colors.surfaceAlt },
  logoPlaceholder: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoBtn: {
    position: 'absolute', bottom: -4, right: -4,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primary,
    borderWidth: 2, borderColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  logoFallback: { width: 46, height: 46, opacity: 0.6 },
  groupName: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.white, textAlign: 'center', marginBottom: 6 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  groupMeta: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)' },
  memberCount: { fontSize: Typography.sm, color: Colors.primaryLight, fontWeight: Typography.semiBold, marginTop: 6 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.base, marginBottom: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.sm },
  cardBody: { fontSize: Typography.base, color: Colors.textSecondary, lineHeight: Typography.base * 1.6 },
  emptyText: { fontSize: Typography.sm, color: Colors.textLight },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  memberInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  memberName: { fontSize: Typography.sm, color: Colors.text, fontWeight: Typography.medium },
  memberBadge: { backgroundColor: Colors.primaryLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  memberBadgeText: { fontSize: 10, color: Colors.primary, fontWeight: Typography.bold },
  moreMembers: { fontSize: Typography.sm, color: Colors.textLight, marginTop: Spacing.sm, textAlign: 'center' },
  socials: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surfaceAlt, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  socialText: { fontSize: Typography.sm, color: Colors.text },
  actions: { marginTop: Spacing.sm },
  myGroupBanner: {
    backgroundColor: Colors.success, borderRadius: 12, padding: Spacing.base,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  myGroupText: { fontSize: Typography.base, color: Colors.white, fontWeight: Typography.semiBold },
});
