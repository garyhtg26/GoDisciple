import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Clock } from 'lucide-react-native';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';
import { formatTime } from '../utils/formatDate';

const TYPE_CONFIG = {
  service:  { label: 'Ibadah',          color: Colors.primary, bg: Colors.primaryLight },
  group:    { label: 'Group Meeting',   color: Colors.info,    bg: '#D4E8F8' },
  event:    { label: 'Special Event',   color: Colors.success, bg: '#D4EEE0' },
  training: { label: 'Class / Training',color: Colors.warning, bg: '#F8EDD4' },
};

export default function ScheduleCard({ schedule }) {
  const config = TYPE_CONFIG[schedule.type] || TYPE_CONFIG.event;

  return (
    <View style={[styles.card, { borderLeftColor: config.color }]}>
      <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
        <Text style={[styles.typeLabel, { color: config.color }]}>{config.label}</Text>
      </View>
      <Text style={styles.title}>{schedule.title}</Text>
      {schedule.description ? (
        <Text style={styles.desc} numberOfLines={2}>{schedule.description}</Text>
      ) : null}
      <View style={styles.row}>
        {schedule.startDateTime && (
          <View style={styles.metaRow}>
            <Clock size={12} color={Colors.textSecondary} />
            <Text style={styles.meta}>{formatTime(schedule.startDateTime)}</Text>
          </View>
        )}
        {schedule.location ? (
          <View style={styles.metaRow}>
            <MapPin size={12} color={Colors.textSecondary} />
            <Text style={styles.meta}>{schedule.location}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: Spacing.base,
    marginBottom: Spacing.sm, borderLeftWidth: 3,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  typeBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6 },
  typeLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.text, marginBottom: 4 },
  desc: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: 6, lineHeight: Typography.sm * 1.5 },
  row: { flexDirection: 'row', gap: Spacing.base, flexWrap: 'wrap' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: Typography.xs, color: Colors.textSecondary },
});
