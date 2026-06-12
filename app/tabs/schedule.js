import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Clock, CalendarX, ChevronLeft, ChevronRight, Users } from 'lucide-react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import { getSchedulesForUser } from '../../src/services/scheduleService';
import LoadingState from '../../src/components/LoadingState';
import EmptyState from '../../src/components/EmptyState';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';
import AppHeader from '../../src/components/AppHeader';
import { formatTime } from '../../src/utils/formatDate';

const TYPE_CONFIG = {
  service:  { label: 'Ibadah',           color: Colors.primary, bg: Colors.primaryLight },
  group:    { label: 'Group Meeting',    color: Colors.info,    bg: '#D4E8F8' },
  event:    { label: 'Special Event',    color: Colors.success, bg: '#D4EEE0' },
  training: { label: 'Class / Training', color: Colors.warning, bg: '#F8EDD4' },
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function toDate(ts) {
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
}

// Calendar cells for a month: leading/trailing nulls pad to full weeks.
function getMonthCells(year, month) {
  const startDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const { profile } = useAuthContext();
  const today = new Date();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // calendar always opens on the current month
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);

  async function loadData() {
    try {
      setSchedules(await getSchedulesForUser(profile?.groupId || null));
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { loadData(); }, [profile?.groupId]);
  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [profile?.groupId]);

  // events grouped per calendar day
  const eventsByDay = useMemo(() => {
    const map = {};
    schedules.forEach(s => {
      const d = toDate(s.startDateTime);
      if (!d) return;
      const key = dateKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [schedules]);

  const cells = useMemo(() => getMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const selectedEvents = eventsByDay[dateKey(selectedDate)] || [];
  const todayKey = dateKey(today);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }
  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(today);
  }

  if (loading) return <LoadingState />;

  const isViewingCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Schedule" showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* ── Calendar card ── */}
        <View style={styles.calendar}>
          {/* Month header */}
          <View style={styles.monthRow}>
            <TouchableOpacity onPress={prevMonth} style={styles.monthBtn} hitSlop={8}>
              <ChevronLeft size={20} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={goToday} activeOpacity={0.7}>
              <Text style={styles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
              {!isViewingCurrentMonth && <Text style={styles.todayHint}>tap to go to today</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={nextMonth} style={styles.monthBtn} hitSlop={8}>
              <ChevronRight size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Weekday header */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map(w => (
              <Text key={w} style={[styles.weekday, w === 'Sun' && styles.weekdaySun]}>{w}</Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.grid}>
            {cells.map((d, i) => {
              if (!d) return <View key={`x${i}`} style={styles.cell} />;
              const key = dateKey(d);
              const isToday = key === todayKey;
              const isSelected = key === dateKey(selectedDate);
              const dayEvents = eventsByDay[key] || [];
              return (
                <TouchableOpacity
                  key={key}
                  style={styles.cell}
                  onPress={() => setSelectedDate(d)}
                  activeOpacity={0.6}
                >
                  <View style={[
                    styles.dayCircle,
                    isToday && styles.dayToday,
                    isSelected && !isToday && styles.daySelected,
                  ]}>
                    <Text style={[
                      styles.dayText,
                      isToday && styles.dayTextToday,
                      isSelected && !isToday && styles.dayTextSelected,
                    ]}>
                      {d.getDate()}
                    </Text>
                  </View>
                  {/* event indicators */}
                  <View style={styles.dotsRow}>
                    {dayEvents.slice(0, 3).map((ev, j) => (
                      <View
                        key={j}
                        style={[styles.dot, { backgroundColor: (TYPE_CONFIG[ev.type] || TYPE_CONFIG.event).color }]}
                      />
                    ))}
                    {dayEvents.length > 3 && <Text style={styles.dotMore}>+</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Selected day events ── */}
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderText}>
            {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <Text style={styles.dayHeaderCount}>
            {selectedEvents.length} {selectedEvents.length === 1 ? 'event' : 'events'}
          </Text>
        </View>

        {selectedEvents.length === 0 ? (
          <EmptyState
            IconComponent={CalendarX}
            title="No events this day"
            subtitle="Pick a date with a dot to see its events."
          />
        ) : (
          selectedEvents.map(s => {
            const config = TYPE_CONFIG[s.type] || TYPE_CONFIG.event;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.card, { borderLeftColor: config.color }]}
                onPress={() => router.push(`/schedule/${s.id}`)}
                activeOpacity={0.75}
              >
                <View style={styles.badgeRow}>
                  <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
                    <Text style={[styles.typeLabel, { color: config.color }]}>{config.label}</Text>
                  </View>
                  {s.isPublic === false && (
                    <View style={styles.groupBadge}>
                      <Users size={10} color={Colors.textSecondary} />
                      <Text style={styles.groupBadgeText}>My Group</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardTitle}>{s.title}</Text>
                {s.description ? <Text style={styles.cardDesc} numberOfLines={2}>{s.description}</Text> : null}
                <View style={styles.cardMeta}>
                  {s.startDateTime && (
                    <View style={styles.metaRow}>
                      <Clock size={12} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>
                        {formatTime(s.startDateTime)}{s.endDateTime ? ` – ${formatTime(s.endDateTime)}` : ''}
                      </Text>
                    </View>
                  )}
                  {s.location ? (
                    <View style={styles.metaRow}>
                      <MapPin size={12} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>{s.location}</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },

  // ── Calendar
  calendar: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  monthBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  monthLabel: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  todayHint: {
    fontSize: 10,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 1,
  },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
    color: Colors.textLight,
  },
  weekdaySun: { color: Colors.error },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 46,
  },
  dayCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  dayToday: { backgroundColor: Colors.primary },
  daySelected: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dayText: { fontSize: Typography.sm, color: Colors.text },
  dayTextToday: { color: Colors.white, fontWeight: Typography.bold },
  dayTextSelected: { fontWeight: Typography.bold },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 8,
    marginTop: 2,
  },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  dotMore: { fontSize: 8, color: Colors.textLight, lineHeight: 8 },

  // ── Day events
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  dayHeaderText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.text,
    flex: 1,
  },
  dayHeaderCount: { fontSize: Typography.xs, color: Colors.textLight },

  card: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: Spacing.base,
    marginBottom: Spacing.sm, borderLeftWidth: 3,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  typeLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  groupBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.surfaceAlt, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.border,
  },
  groupBadgeText: { fontSize: 10, fontWeight: Typography.semiBold, color: Colors.textSecondary },
  cardTitle: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.text, marginBottom: 4 },
  cardDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: 6, lineHeight: Typography.sm * 1.5 },
  cardMeta: { flexDirection: 'row', gap: Spacing.base, flexWrap: 'wrap' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Typography.xs, color: Colors.textSecondary },
});
