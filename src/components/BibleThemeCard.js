import React from 'react';
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';

export default function BibleThemeCard({ theme, compact = false }) {
  const router = useRouter();
  if (!theme) return null;

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={() => router.push(`/bible-theme/${theme.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.compactIconRow}>
          <BookOpen size={14} color={Colors.primaryLight} />
          <Text style={styles.compactLabel}>Bible Theme</Text>
        </View>
        <Text style={styles.compactTitle}>{theme.title}</Text>
        <Text style={styles.compactRef}>{theme.scriptureReference}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={() => router.push(`/bible-theme/${theme.id}`)} activeOpacity={0.88}>
      <ImageBackground
        source={theme.imageURL ? { uri: theme.imageURL } : null}
        style={styles.card}
        imageStyle={styles.image}
      >
        {!theme.imageURL && <View style={styles.noImageBg} />}
        <View style={styles.textWrap}>
          <View style={styles.labelRow}>
            <BookOpen size={10} color={Colors.white} strokeWidth={2} />
            <Text style={styles.label}>Bible Theme</Text>
          </View>
          <Text style={styles.ref} numberOfLines={1}>{theme.scriptureReference}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: Spacing.base,
    height: 160,
    justifyContent: 'flex-start',
    padding: Spacing.base,
  },
  image: { borderRadius: 20, resizeMode: 'cover' },
  noImageBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primaryDark,
  },
  textWrap: {
    alignSelf: 'flex-start',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 13,
    fontWeight: Typography.bold,
    color: Colors.white,
    marginBottom: 2,
    lineHeight: 16,
    maxWidth: 140,
  },
  ref: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: Typography.medium,
    maxWidth: 140,
  },
  // compact version (used elsewhere)
  compactCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  compactIconRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  compactLabel: {
    fontSize: Typography.xs,
    color: Colors.primary,
    fontWeight: Typography.bold,
    letterSpacing: 0.5,
  },
  compactTitle: { fontSize: Typography.sm, color: Colors.text, fontWeight: Typography.semiBold, marginBottom: 2 },
  compactRef: { fontSize: Typography.xs, color: Colors.textSecondary },
});
