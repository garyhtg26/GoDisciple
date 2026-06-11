import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';

// icon prop accepts a Lucide component OR a fallback emoji string
export default function EmptyState({ icon, IconComponent, title = 'Nothing here yet', subtitle, action }) {
  return (
    <View style={styles.container}>
      {IconComponent ? (
        <View style={styles.iconCircle}>
          <IconComponent size={32} color={Colors.primary} />
        </View>
      ) : (
        <Text style={styles.iconEmoji}>{icon || '📭'}</Text>
      )}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {action || null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.xxxl, gap: Spacing.sm,
  },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  iconEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  title: {
    fontSize: Typography.md, fontWeight: Typography.semiBold,
    color: Colors.text, textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sm, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: Typography.sm * Typography.relaxed,
  },
});
