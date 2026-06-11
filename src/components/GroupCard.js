import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Users, ChevronRight } from 'lucide-react-native';
const GROUP_PLACEHOLDER = require('../../assets/logo-black.png');
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';

export default function GroupCard({ group }) {
  const router = useRouter();
  const memberCount = group.memberIds?.length || 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/group/${group.id}`)}
      activeOpacity={0.85}
    >
      {group.logoURL ? (
        <Image source={{ uri: group.logoURL }} style={styles.logo} />
      ) : (
        <View style={styles.logoPlaceholder}>
          <Image source={GROUP_PLACEHOLDER} style={styles.logoFallback} resizeMode="contain" />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
        {group.location ? (
          <View style={styles.metaRow}>
            <MapPin size={11} color={Colors.textSecondary} />
            <Text style={styles.meta} numberOfLines={1}>{group.location}</Text>
          </View>
        ) : null}
        {group.ageRange ? (
          <View style={styles.metaRow}>
            <Users size={11} color={Colors.textSecondary} />
            <Text style={styles.meta}>Ages {group.ageRange}</Text>
          </View>
        ) : null}
        <Text style={styles.members}>{memberCount} member{memberCount !== 1 ? 's' : ''}</Text>
      </View>
      <ChevronRight size={20} color={Colors.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.base,
    marginBottom: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, gap: Spacing.md,
  },
  logo: { width: 56, height: 56, borderRadius: 14, resizeMode: 'cover', backgroundColor: Colors.surfaceAlt },
  logoPlaceholder: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  logoFallback: { width: 32, height: 32, opacity: 0.35 },
  info: { flex: 1 },
  name: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.text, marginBottom: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  meta: { fontSize: Typography.xs, color: Colors.textSecondary },
  members: { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.medium, marginTop: 4 },
});
