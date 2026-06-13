import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ImageBackground, Animated, Easing, Modal, TextInput,
  Dimensions, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Flame, Check, Sparkles, Share2,
  Trophy, Lock, BookOpen, Sun,
} from 'lucide-react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import {
  getQuietTimeStats, checkInQuietTime, localDateStr, TIERS,
} from '../../src/services/quietTimeService';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

const { width: W } = Dimensions.get('window');

// Warm accent palette — local to this screen, to make it feel inviting.
const WARM = '#E08D3C';
const WARM_DEEP = '#C56A1A';
const HERO_URI = 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1200&q=80';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const QUICK_BOOKS = ['Mazmur', 'Amsal', 'Yohanes', 'Matius', 'Roma', 'Kejadian', 'Yesaya', 'Lukas'];

// Build a GitHub-style heatmap: `weeks` full weeks ending this Saturday, Sun-first.
function buildWeeks(dateSet, weeks = 5) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = localDateStr(today);
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay())); // upcoming Saturday
  const start = new Date(end);
  start.setDate(start.getDate() - (weeks * 7 - 1)); // back to a Sunday

  const cells = [];
  const cur = new Date(start);
  while (cur <= end) {
    const ds = localDateStr(cur);
    let status;
    if (ds === todayStr) status = dateSet.has(ds) ? 'done' : 'today';
    else if (cur > today) status = 'future';
    else status = dateSet.has(ds) ? 'done' : 'missed';
    cells.push({ ds, status, dayNum: cur.getDate() });
    cur.setDate(cur.getDate() + 1);
  }
  // chunk into rows of 7
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export default function QuietTimeScreen() {
  const router = useRouter();
  const { user } = useAuthContext();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(null); // null | 'book' | 'share' | 'thanks'
  const [book, setBook] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const s = await getQuietTimeStats(user.uid);
      setStats(s);
    } catch (e) {
      console.warn('Quiet time load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Animated warm glow behind the flame ──────────────────────────
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  // ── Thank-you celebration pop ────────────────────────────────────
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (step === 'thanks') {
      pop.setValue(0);
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    }
  }, [step, pop]);

  // ── Check-in flow ────────────────────────────────────────────────
  function openCheckIn() {
    setBook('');
    setStep('book');
  }

  async function submitCheckIn() {
    if (!user || submitting) return;
    setSubmitting(true);
    try {
      await checkInQuietTime(user.uid, { book: book.trim() });
      await load();
      setStep('share');
    } catch (e) {
      // Even on error, surface it but don't trap the user.
      console.warn('Check-in error:', e);
      setStep('share');
    } finally {
      setSubmitting(false);
    }
  }

  function shareToStream() {
    const b = book.trim();
    const prefill = b
      ? `Saat teduh hari ini dari kitab ${b} 🙏`
      : 'Saat teduh hari ini 🙏';
    setStep(null);
    router.push({ pathname: '/stream/create', params: { prefill, category: 'reflection' } });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header onBack={() => router.back()} />
        <View style={styles.loadingWrap}><ActivityIndicator size="large" color={WARM} /></View>
      </SafeAreaView>
    );
  }

  const s = stats || {};
  const streak = s.currentStreak || 0;
  const checkedInToday = s.checkedInToday;
  const tier = s.tier;
  const nextTier = s.nextTier;
  const weeks = buildWeeks(s.dateSet || new Set());

  // progress to next tier
  let progress = 1;
  let toGo = 0;
  if (nextTier) {
    const base = tier ? tier.days : 0;
    progress = Math.max(0, Math.min(1, (streak - base) / (nextTier.days - base)));
    toGo = nextTier.days - streak;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header onBack={() => router.back()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── HERO with animated glow ─────────────────────────────── */}
        <ImageBackground source={{ uri: HERO_URI }} style={styles.hero} resizeMode="cover">
          <View style={styles.heroOverlay}>
            <View style={styles.glowWrap}>
              <Animated.View style={[styles.glow, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />
              <View style={styles.flameCircle}>
                <Flame size={40} color={WARM} fill={WARM} strokeWidth={1.5} />
              </View>
            </View>
            <Text style={styles.heroStreak}>{streak}</Text>
            <Text style={styles.heroStreakLabel}>
              {streak === 1 ? 'day streak' : 'day streak'}
            </Text>
            <Text style={styles.heroSub}>
              {checkedInToday
                ? 'You spent time with God today 🙏'
                : 'Spend a quiet moment with God today'}
            </Text>
          </View>
        </ImageBackground>

        {/* ── TIER BADGE + PROGRESS ───────────────────────────────── */}
        <View style={styles.tierCard}>
          <View style={[styles.tierBadge, { backgroundColor: tier ? tier.color : Colors.surfaceAlt }]}>
            <Trophy size={20} color={tier ? Colors.white : Colors.textLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tierLabel}>{tier ? `${tier.label} Tier` : 'No tier yet'}</Text>
            <Text style={styles.tierBlurb}>
              {tier ? tier.blurb : 'Check in today to start your journey.'}
            </Text>
            {nextTier && (
              <>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {toGo} more {toGo === 1 ? 'day' : 'days'} → {nextTier.label}
                </Text>
              </>
            )}
            {!nextTier && tier && (
              <Text style={[styles.progressText, { color: tier.color, fontWeight: Typography.bold }]}>
                Highest tier reached ✦
              </Text>
            )}
          </View>
        </View>

        {/* ── STAT ROW ─────────────────────────────────────────────── */}
        <View style={styles.statRow}>
          <Stat value={streak} label="Current" />
          <View style={styles.statDivider} />
          <Stat value={s.longestStreak || 0} label="Longest" />
          <View style={styles.statDivider} />
          <Stat value={s.totalDays || 0} label="Total days" />
        </View>

        {/* ── CALENDAR HEATMAP ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 5 weeks</Text>
          <Text style={styles.sectionHint}>Filled = quiet time done · empty = missed</Text>
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((d, i) => <Text key={i} style={styles.weekdayLabel}>{d}</Text>)}
          </View>
          {weeks.map((row, ri) => (
            <View key={ri} style={styles.weekRow}>
              {row.map((c, ci) => <DayCell key={ci} cell={c} />)}
            </View>
          ))}
        </View>

        {/* ── BADGES ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgeRow}>
            {[...TIERS].reverse().map(t => {
              const unlocked = (s.longestStreak || 0) >= t.days;
              return (
                <View key={t.key} style={styles.badgeItem}>
                  <View style={[styles.badgeCircle, { backgroundColor: unlocked ? t.color : Colors.surfaceAlt }]}>
                    {unlocked
                      ? <Trophy size={18} color={Colors.white} />
                      : <Lock size={16} color={Colors.textLight} />}
                  </View>
                  <Text style={[styles.badgeDays, unlocked && { color: t.color, fontWeight: Typography.bold }]}>
                    {t.days}d
                  </Text>
                  <Text style={styles.badgeName}>{t.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── CHECK-IN BUTTON (sticky) ───────────────────────────────── */}
      <View style={styles.ctaBar}>
        {checkedInToday ? (
          <View style={styles.doneBtn}>
            <Check size={20} color={Colors.success} />
            <Text style={styles.doneBtnText}>Saat teduh selesai hari ini</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.checkBtn} onPress={openCheckIn} activeOpacity={0.85}>
            <Sun size={20} color={Colors.white} />
            <Text style={styles.checkBtnText}>Check In Saat Teduh</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── FLOW MODAL ─────────────────────────────────────────────── */}
      <Modal visible={!!step} transparent animationType="fade" onRequestClose={() => setStep(null)}>
        <View style={styles.modalOverlay}>
          {/* STEP 1 — which book */}
          {step === 'book' && (
            <View style={styles.modalCard}>
              <View style={styles.modalIconWrap}><BookOpen size={26} color={WARM} /></View>
              <Text style={styles.modalTitle}>Kamu saat teduh di buku apa hari ini?</Text>
              <Text style={styles.modalSub}>Boleh dikosongkan kalau tidak ingin mencatat.</Text>
              <TextInput
                style={styles.input}
                value={book}
                onChangeText={setBook}
                placeholder="cth. Mazmur, Yohanes 3…"
                placeholderTextColor={Colors.textLight}
                autoFocus
              />
              <View style={styles.bookChips}>
                {QUICK_BOOKS.map(b => (
                  <TouchableOpacity key={b} style={styles.bookChip} onPress={() => setBook(b)}>
                    <Text style={styles.bookChipText}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.modalPrimary} onPress={submitCheckIn} disabled={submitting} activeOpacity={0.85}>
                {submitting
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.modalPrimaryText}>Lanjut</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(null)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>Batal</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2 — share? */}
          {step === 'share' && (
            <View style={styles.modalCard}>
              <View style={styles.modalIconWrap}><Share2 size={26} color={WARM} /></View>
              <Text style={styles.modalTitle}>Mau bagikan saat teduhmu?</Text>
              <Text style={styles.modalSub}>Berbagi bisa menguatkan saudara seimanmu.</Text>
              <TouchableOpacity style={styles.modalPrimary} onPress={shareToStream} activeOpacity={0.85}>
                <Share2 size={16} color={Colors.white} />
                <Text style={styles.modalPrimaryText}>Bagikan ke Stream</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSecondary} onPress={() => setStep('thanks')} activeOpacity={0.85}>
                <Text style={styles.modalSecondaryText}>Nanti aja</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3 — thank you */}
          {step === 'thanks' && (
            <View style={styles.modalCard}>
              <Animated.View style={[styles.thanksGlow, { transform: [{ scale: pop }] }]}>
                <View style={styles.thanksCircle}>
                  <Sparkles size={36} color={WARM} fill={WARM} />
                </View>
              </Animated.View>
              <Text style={styles.modalTitle}>Terima kasih! 🙏</Text>
              <Text style={styles.modalSub}>
                Hari ke-{streak} dalam perjalananmu bersama Tuhan. Sampai jumpa besok!
              </Text>
              <TouchableOpacity style={styles.modalPrimary} onPress={() => setStep(null)} activeOpacity={0.85}>
                <Text style={styles.modalPrimaryText}>Selesai</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Header({ onBack }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={8}>
        <ArrowLeft size={22} color={Colors.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Quiet Time</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DayCell({ cell }) {
  const base = [styles.dayCell];
  if (cell.status === 'done') base.push(styles.dayDone);
  else if (cell.status === 'missed') base.push(styles.dayMissed);
  else if (cell.status === 'today') base.push(styles.dayToday);
  else base.push(styles.dayFuture);
  return (
    <View style={base}>
      {cell.status === 'done' && <Check size={13} color={Colors.white} strokeWidth={3} />}
    </View>
  );
}

const GRID_GAP = 6;
const CELL = Math.min(40, Math.floor((W - Spacing.base * 2 - Spacing.base * 2 - GRID_GAP * 6) / 7));

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { flexGrow: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  backBtn: { width: 40, padding: 4 },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: Typography.md, fontWeight: Typography.semiBold, color: Colors.text,
  },

  // Hero
  hero: { width: '100%', height: 300 },
  heroOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  glowWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  glow: {
    position: 'absolute',
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: WARM,
  },
  flameCircle: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  heroStreak: {
    fontSize: 56, fontWeight: Typography.bold, color: Colors.white,
    lineHeight: 62, marginTop: Spacing.sm,
  },
  heroStreakLabel: {
    fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: Typography.semiBold,
  },
  heroSub: {
    fontSize: Typography.sm, color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing.sm, textAlign: 'center',
  },

  // Tier card
  tierCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, marginHorizontal: Spacing.base,
    marginTop: -Spacing.lg, padding: Spacing.base, borderRadius: 18,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  tierBadge: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  tierLabel: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.text },
  tierBlurb: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2, marginBottom: 8 },
  progressTrack: {
    height: 7, borderRadius: 4, backgroundColor: Colors.surfaceAlt, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: WARM },
  progressText: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 5 },

  // Stat row
  statRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, marginHorizontal: Spacing.base,
    marginTop: Spacing.md, paddingVertical: Spacing.base, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.divider,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text },
  statLabel: {
    fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.divider },

  // Sections
  section: {
    backgroundColor: Colors.surface, marginHorizontal: Spacing.base,
    marginTop: Spacing.md, padding: Spacing.base, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.divider,
  },
  sectionTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.text },
  sectionHint: { fontSize: Typography.xs, color: Colors.textLight, marginTop: 2, marginBottom: Spacing.md },

  // Heatmap
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: GRID_GAP },
  weekdayLabel: {
    width: CELL, textAlign: 'center',
    fontSize: Typography.xs, color: Colors.textLight, fontWeight: Typography.medium,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: GRID_GAP },
  dayCell: {
    width: CELL, height: CELL, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  dayDone: { backgroundColor: WARM },
  dayMissed: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border },
  dayToday: { backgroundColor: Colors.surface, borderWidth: 2, borderColor: WARM_DEEP },
  dayFuture: { backgroundColor: Colors.surfaceAlt, opacity: 0.4 },

  // Badges
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  badgeItem: { alignItems: 'center', flex: 1 },
  badgeCircle: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  badgeDays: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semiBold },
  badgeName: { fontSize: 10, color: Colors.textLight, marginTop: 1 },

  // CTA bar
  ctaBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: Spacing.base, paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.base,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  checkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: WARM_DEEP, paddingVertical: Spacing.base, borderRadius: 14,
  },
  checkBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.white },
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#E8F3EC', paddingVertical: Spacing.base, borderRadius: 14,
  },
  doneBtnText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.success },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', padding: Spacing.lg,
  },
  modalCard: {
    width: '100%', maxWidth: 380,
    backgroundColor: Colors.surface, borderRadius: 24, padding: Spacing.xl,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#FBEFE2', alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  modalTitle: {
    fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.text,
    textAlign: 'center', lineHeight: 24,
  },
  modalSub: {
    fontSize: Typography.sm, color: Colors.textSecondary,
    textAlign: 'center', marginTop: 6, marginBottom: Spacing.lg,
  },
  input: {
    width: '100%', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    fontSize: Typography.base, color: Colors.text, backgroundColor: Colors.surface,
  },
  bookChips: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginTop: Spacing.md, marginBottom: Spacing.lg, justifyContent: 'center',
  },
  bookChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
  },
  bookChipText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.medium },
  modalPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', backgroundColor: WARM_DEEP, paddingVertical: Spacing.base, borderRadius: 14,
  },
  modalPrimaryText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.white },
  modalSecondary: { width: '100%', paddingVertical: Spacing.md, marginTop: Spacing.sm, alignItems: 'center' },
  modalSecondaryText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semiBold },
  modalClose: { marginTop: Spacing.md },
  modalCloseText: { fontSize: Typography.sm, color: Colors.textLight },

  // Thanks
  thanksGlow: { marginBottom: Spacing.base },
  thanksCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FBEFE2', alignItems: 'center', justifyContent: 'center',
  },
});
