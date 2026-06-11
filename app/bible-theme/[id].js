import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Radio } from 'lucide-react-native';
import { getBibleTheme } from '../../src/services/cmsService';
import AppHeader from '../../src/components/AppHeader';
import LoadingState from '../../src/components/LoadingState';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';
import { formatDate } from '../../src/utils/formatDate';

export default function BibleThemeDetailScreen() {
  const { id } = useLocalSearchParams();
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBibleTheme(id).then(t => { setTheme(t); setLoading(false); });
  }, [id]);

  if (loading) return <LoadingState />;
  if (!theme) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Bible Theme" showBack />
      <View style={styles.center}><Text>Theme not found.</Text></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Bible Theme" showBack />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <ImageBackground
          source={theme.imageURL ? { uri: theme.imageURL } : null}
          style={styles.hero}
          imageStyle={styles.heroImg}
        >
          {!theme.imageURL && <View style={styles.heroSolid} />}
          <View style={styles.heroTextBox}>
            {theme.isActive && (
              <View style={styles.activeBadge}>
                <Radio size={9} color={Colors.white} />
                <Text style={styles.activeBadgeText}>ACTIVE</Text>
              </View>
            )}
            <Text style={styles.heroTitle}>{theme.title}</Text>
            {theme.subtitle ? <Text style={styles.heroSubtitle}>{theme.subtitle}</Text> : null}
          </View>
        </ImageBackground>

        <View style={styles.body}>
          {/* Scripture */}
          <View style={styles.scriptureCard}>
            <Text style={styles.scriptureRef}>{theme.scriptureReference}</Text>
            {theme.scriptureText ? (
              <Text style={styles.scriptureText}>"{theme.scriptureText}"</Text>
            ) : null}
          </View>

          {/* Description */}
          {theme.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reflection</Text>
              <Text style={styles.bodyText}>{theme.description}</Text>
            </View>
          ) : null}

          {/* Dates */}
          <View style={styles.datesRow}>
            {theme.startDate && (
              <View style={styles.dateChip}>
                <Text style={styles.dateChipLabel}>Start</Text>
                <Text style={styles.dateChipValue}>
                  {typeof theme.startDate === 'string' ? theme.startDate : formatDate(theme.startDate)}
                </Text>
              </View>
            )}
            {theme.endDate && (
              <View style={styles.dateChip}>
                <Text style={styles.dateChipLabel}>End</Text>
                <Text style={styles.dateChipValue}>
                  {typeof theme.endDate === 'string' ? theme.endDate : formatDate(theme.endDate)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingBottom: Spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    height: 280,
    justifyContent: 'flex-start',
    padding: Spacing.base,
  },
  heroImg: { resizeMode: 'cover' },
  heroSolid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primaryDark,
  },
  heroTextBox: {
    alignSelf: 'flex-start',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(26,122,74,0.9)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginBottom: 8,
  },
  activeBadgeText: { fontSize: 10, color: Colors.white, fontWeight: Typography.bold, letterSpacing: 0.4 },
  heroTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.white,
    lineHeight: Typography.lg * 1.3,
    marginBottom: 4,
  },
  heroSubtitle: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.85)' },
  body: { padding: Spacing.base },
  scriptureCard: {
    backgroundColor: Colors.primary, borderRadius: 16,
    padding: Spacing.xl, marginBottom: Spacing.base,
  },
  scriptureRef: {
    fontSize: Typography.sm, fontWeight: Typography.bold,
    color: Colors.primaryLight, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase',
  },
  scriptureText: {
    fontSize: Typography.md, color: Colors.white,
    fontStyle: 'italic', lineHeight: Typography.md * 1.7,
  },
  section: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.base, marginBottom: Spacing.base,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  sectionTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.sm },
  bodyText: { fontSize: Typography.base, color: Colors.textSecondary, lineHeight: Typography.base * 1.7 },
  datesRow: { flexDirection: 'row', gap: Spacing.sm },
  dateChip: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.md, alignItems: 'center',
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  dateChipLabel: {
    fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textLight,
    marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  dateChipValue: { fontSize: Typography.sm, color: Colors.text, fontWeight: Typography.medium },
});
