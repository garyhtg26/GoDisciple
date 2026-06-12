import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Clock, Calendar, Users, Check, X, CalendarX } from 'lucide-react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import { getSchedule, setRsvp, getMyRsvp, getRsvpCounts } from '../../src/services/scheduleService';
import AppHeader from '../../src/components/AppHeader';
import LoadingState from '../../src/components/LoadingState';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';
import { formatTime } from '../../src/utils/formatDate';

const TYPE_CONFIG = {
  service:  { label: 'Ibadah',           color: Colors.primary, bg: Colors.primaryLight },
  group:    { label: 'Group Meeting',    color: Colors.info,    bg: '#D4E8F8' },
  event:    { label: 'Special Event',    color: Colors.success, bg: '#D4EEE0' },
  training: { label: 'Class / Training', color: Colors.warning, bg: '#F8EDD4' },
};

function toDate(ts) {
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
}

function fmtFullDate(ts) {
  const d = toDate(ts);
  if (!d) return '';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user, profile } = useAuthContext();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myStatus, setMyStatus] = useState(null);
  const [counts, setCounts] = useState({ going: 0, notGoing: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [ev, status, c] = await Promise.all([
          getSchedule(id),
          user ? getMyRsvp(id, user.uid) : null,
          getRsvpCounts(id),
        ]);
        setEvent(ev);
        setMyStatus(status);
        setCounts(c);
      } catch (e) { console.warn(e); }
      finally { setLoading(false); }
    })();
  }, [id, user]);

  async function handleRsvp(status) {
    if (!user || saving) return;
    const prev = myStatus;
    if (prev === status) return;
    setSaving(true);
    setMyStatus(status); // optimistic
    setCounts(c => ({
      going: c.going + (status === 'going' ? 1 : 0) - (prev === 'going' ? 1 : 0),
      notGoing: c.notGoing + (status === 'not_going' ? 1 : 0) - (prev === 'not_going' ? 1 : 0),
    }));
    try {
      await setRsvp(id, user.uid, status, profile?.fullName || user.email);
    } catch (e) {
      console.warn(e);
      setMyStatus(prev); // rollback
    } finally { setSaving(false); }
  }

  if (loading) return <LoadingState />;
  if (!event) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Event" showBack />
      <View style={styles.center}>
        <CalendarX size={40} color={Colors.textLight} />
        <Text style={styles.notFound}>Event not found.</Text>
      </View>
    </SafeAreaView>
  );

  const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.event;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Event Detail" showBack />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Poster — IG post ratio */}
        {event.posterURL ? (
          <Image source={{ uri: event.posterURL }} style={styles.poster} />
        ) : null}

        <View style={styles.body}>
          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
              <Text style={[styles.typeLabel, { color: config.color }]}>{config.label}</Text>
            </View>
            {event.isPublic === false && (
              <View style={styles.groupBadge}>
                <Users size={10} color={Colors.textSecondary} />
                <Text style={styles.groupBadgeText}>My Group</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{event.title}</Text>

          {/* Meta */}
          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <Calendar size={16} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{fmtFullDate(event.startDateTime)}</Text>
            </View>
            {event.startDateTime && (
              <View style={styles.metaRow}>
                <Clock size={16} color={Colors.textSecondary} />
                <Text style={styles.metaText}>
                  {formatTime(event.startDateTime)}{event.endDateTime ? ` – ${formatTime(event.endDateTime)}` : ''}
                </Text>
              </View>
            )}
            {event.location ? (
              <View style={styles.metaRow}>
                <MapPin size={16} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{event.location}</Text>
              </View>
            ) : null}
          </View>

          {/* Description */}
          {event.description ? (
            <Text style={styles.description}>{event.description}</Text>
          ) : null}

          {/* RSVP */}
          <View style={styles.rsvpCard}>
            <Text style={styles.rsvpTitle}>Will you attend?</Text>
            <Text style={styles.rsvpCount}>
              {counts.going} {counts.going === 1 ? 'person is' : 'people are'} going
            </Text>
            <View style={styles.rsvpRow}>
              <TouchableOpacity
                style={[styles.rsvpBtn, myStatus === 'going' && styles.rsvpBtnGoing]}
                onPress={() => handleRsvp('going')}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Check size={18} color={myStatus === 'going' ? Colors.white : Colors.success} />
                <Text style={[styles.rsvpBtnText, { color: myStatus === 'going' ? Colors.white : Colors.success }]}>
                  Hadir
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.rsvpBtn, myStatus === 'not_going' && styles.rsvpBtnNotGoing]}
                onPress={() => handleRsvp('not_going')}
                disabled={saving}
                activeOpacity={0.8}
              >
                <X size={18} color={myStatus === 'not_going' ? Colors.white : Colors.error} />
                <Text style={[styles.rsvpBtnText, { color: myStatus === 'not_going' ? Colors.white : Colors.error }]}>
                  Tidak Hadir
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  notFound: { fontSize: Typography.base, color: Colors.textSecondary },

  poster: {
    width: '100%',
    aspectRatio: 4 / 5, // Instagram post ratio
    backgroundColor: Colors.surfaceAlt,
    resizeMode: 'cover',
  },

  body: { padding: Spacing.base },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  groupBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.surfaceAlt, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.border,
  },
  groupBadgeText: { fontSize: 10, fontWeight: Typography.semiBold, color: Colors.textSecondary },

  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text,
    lineHeight: Typography.xl * 1.3,
    marginBottom: Spacing.base,
  },

  metaCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.base,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaText: { fontSize: Typography.sm, color: Colors.text, flex: 1 },

  description: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: Typography.base * 1.7,
    marginBottom: Spacing.lg,
  },

  rsvpCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  rsvpTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.text, marginBottom: 2 },
  rsvpCount: { fontSize: Typography.xs, color: Colors.textLight, marginBottom: Spacing.base },
  rsvpRow: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  rsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  rsvpBtnGoing: { backgroundColor: Colors.success, borderColor: Colors.success },
  rsvpBtnNotGoing: { backgroundColor: Colors.error, borderColor: Colors.error },
  rsvpBtnText: { fontSize: Typography.base, fontWeight: Typography.semiBold },
});
