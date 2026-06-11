import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Clock, CalendarX, ArrowLeft } from 'lucide-react-native';
import { getSchedules } from '../../src/services/scheduleService';
import LoadingState from '../../src/components/LoadingState';
import EmptyState from '../../src/components/EmptyState';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';
import AppHeader from '../../src/components/AppHeader';
import { groupByDate, formatDate, formatTime } from '../../src/utils/formatDate';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'service', label: 'Ibadah' },
  { key: 'group', label: 'Group' },
  { key: 'event', label: 'Event' },
  { key: 'training', label: 'Training' },
];

const TYPE_CONFIG = {
  service:  { label: 'Ibadah',          color: Colors.primary, bg: Colors.primaryLight },
  group:    { label: 'Group Meeting',   color: Colors.info,    bg: '#D4E8F8' },
  event:    { label: 'Special Event',   color: Colors.success, bg: '#D4EEE0' },
  training: { label: 'Class / Training',color: Colors.warning, bg: '#F8EDD4' },
};

export default function ScheduleScreen() {
  const router = useRouter();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  async function loadData() {
    try { setSchedules(await getSchedules()); }
    catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { loadData(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, []);

  const filtered = filter === 'all' ? schedules : schedules.filter(s => s.type === filter);
  const grouped = groupByDate(filtered, 'startDateTime');
  const dateKeys = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));

  if (loading) return <LoadingState />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
       <AppHeader title="Schedule" showBack />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {TYPE_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {dateKeys.length === 0 ? (
          <EmptyState
            IconComponent={CalendarX}
            title="No schedules"
            subtitle="There are no upcoming events at the moment."
          />
        ) : (
          dateKeys.map(dateKey => (
            <View key={dateKey} style={styles.dateGroup}>
              <View style={styles.dateLabelRow}>
                <View style={styles.dateDot} />
                <Text style={styles.dateLabel}>{formatDate(new Date(dateKey))}</Text>
              </View>
              {grouped[dateKey].map(s => {
                const config = TYPE_CONFIG[s.type] || TYPE_CONFIG.event;
                return (
                  <View key={s.id} style={[styles.card, { borderLeftColor: config.color }]}>
                    <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
                      <Text style={[styles.typeLabel, { color: config.color }]}>{config.label}</Text>
                    </View>
                    <Text style={styles.cardTitle}>{s.title}</Text>
                    {s.description ? <Text style={styles.cardDesc} numberOfLines={2}>{s.description}</Text> : null}
                    <View style={styles.cardMeta}>
                      {s.startDateTime && (
                        <View style={styles.metaRow}>
                          <Clock size={12} color={Colors.textSecondary} />
                          <Text style={styles.metaText}>{formatTime(s.startDateTime)}</Text>
                        </View>
                      )}
                      {s.location ? (
                        <View style={styles.metaRow}>
                          <MapPin size={12} color={Colors.textSecondary} />
                          <Text style={styles.metaText}>{s.location}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  backBtn: { padding: 4 },
  title: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.text },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterRow: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: Typography.medium, lineHeight: 18 },
  chipTextActive: { color: Colors.white },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  dateGroup: { marginBottom: Spacing.lg },
  dateLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  dateDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  dateLabel: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: Spacing.base,
    marginBottom: Spacing.sm, borderLeftWidth: 3,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  typeBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6 },
  typeLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.text, marginBottom: 4 },
  cardDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: 6, lineHeight: Typography.sm * 1.5 },
  cardMeta: { flexDirection: 'row', gap: Spacing.base, flexWrap: 'wrap' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Typography.xs, color: Colors.textSecondary },
});
