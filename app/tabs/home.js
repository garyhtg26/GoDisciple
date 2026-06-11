import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, RefreshControl, FlatList, ImageBackground,
  Dimensions, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookOpen, Calendar, Moon, BookMarked,
  ChevronRight, Bell, Instagram, Youtube, Users,
} from 'lucide-react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import { getBanners, getNews, getActiveBibleTheme } from '../../src/services/cmsService';
import { getGroups } from '../../src/services/groupService';
import { getLatestVideos } from '../../src/services/youtubeService';
import BibleThemeCard from '../../src/components/BibleThemeCard';
import NewsCard from '../../src/components/NewsCard';
import YouTubeCard from '../../src/components/YouTubeCard';
import LoadingState from '../../src/components/LoadingState';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

const { width: W } = Dimensions.get('window');

const QUICK_ACTIONS = [
  {
    key: 'lesson',
    label: 'Lesson',
    icon: BookOpen,
    bg: '#E8E8E8',
    iconColor: '#0D0D0D',
    route: '/lesson',
  },
  {
    key: 'schedule',
    label: 'Schedule',
    icon: Calendar,
    bg: '#DEDEDE',
    iconColor: '#0D0D0D',
    route: '/tabs/schedule',
  },
  {
    key: 'bible',
    label: 'Bible',
    icon: BookMarked,
    bg: '#E8E8E8',
    iconColor: '#0D0D0D',
    route: '/bible-theme/index',
  },
  {
    key: 'quiettime',
    label: 'Quiet Time',
    icon: Moon,
    bg: '#DEDEDE',
    iconColor: '#0D0D0D',
    route: '/stream/create',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthContext();

  const [banners, setBanners] = useState([]);
  const [news, setNews] = useState([]);
  const [bibleTheme, setBibleTheme] = useState(null);
  const [groups, setGroups] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);

  async function loadData() {
    try {
      const [b, n, bt, g, v] = await Promise.all([
        getBanners(),
        getNews(5),
        getActiveBibleTheme(),
        getGroups(),
        getLatestVideos(4),
      ]);
      setBanners(b);
      setNews(n);
      setBibleTheme(bt);
      setGroups(g.slice(0, 3));
      setVideos(v);
    } catch (e) {
      console.warn('Home load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadData(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, []);

  if (loading) return <LoadingState />;

  const firstName = profile?.fullName?.split(' ')[0] || 'there';
  const hasGroup = !!profile?.groupId;

  // Hero image: first banner or fallback Unsplash worship image
  const heroUri = banners[activeBanner]?.imageURL
    || 'https://images.unsplash.com/photo-1478147427282-58a87a120781?w=1200&q=80';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* ── HERO ──────────────────────────────────────────────────── */}
        <ImageBackground source={{ uri: heroUri }} style={styles.hero} resizeMode="cover">
          <View style={styles.heroOverlay}>
            {/* Top bar */}
            <View style={styles.heroTopBar}>
              <Image
                source={require('../../assets/gkdi-white.png')}
                style={styles.gkdiLogo}
                resizeMode="contain"
              />
              <TouchableOpacity style={styles.notifBtn}>
                <Bell size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {/* Greeting */}
            <View style={styles.heroBottom}>
              <Text style={styles.heroGreeting}>Hello, {firstName} !</Text>
              <View style={styles.logoBar}>
                <Image
                  source={require('../../assets/logo-white.png')}
                  style={styles.heroLogo}
                  resizeMode="contain"
                />
                <Text style={styles.heroTitle}>Go Disciple</Text>
              </View>
              <Text style={styles.heroSub}>To know God and make Him known.</Text>
            </View>

            {/* Banner dots */}
            {banners.length > 1 && (
              <View style={styles.bannerDots}>
                {banners.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dot, i === activeBanner && styles.dotActive]}
                    onPress={() => setActiveBanner(i)}
                  />
                ))}
              </View>
            )}
          </View>
        </ImageBackground>

        {/* ── QUICK ACTIONS ──────────────────────────────────────────── */}
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map(a => {
            const Icon = a.icon;
            return (
              <TouchableOpacity
                key={a.key}
                style={[styles.actionCard, { backgroundColor: a.bg }]}
                onPress={() => router.push(a.route)}
                activeOpacity={0.82}
              >
                <View style={styles.actionIconWrap}>
                  <Icon size={22} color={a.iconColor} strokeWidth={1.8} />
                </View>
                <Text style={[styles.actionLabel, { color: a.iconColor }]}>{a.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── BIBLE THEME THIS MONTH ─────────────────────────────────── */}
        {bibleTheme && (
          <View style={styles.section}>
            <SectionHeader title="Theme This Month" onMore={() => router.push('/bible-theme/index')} />
            <BibleThemeCard theme={bibleTheme} />
          </View>
        )}

        {/* ── JOIN GROUP CTA ─────────────────────────────────────────── */}
        {!hasGroup && groups.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.groupCta}
              onPress={() => router.push('/tabs/group')}
              activeOpacity={0.85}
            >
              <View style={styles.groupCtaLeft}>
                <View style={styles.groupCtaIcon}>
                  <Users size={22} color={Colors.white} />
                </View>
                <View>
                  <Text style={styles.groupCtaTitle}>Join a Discipleship Group</Text>
                  <Text style={styles.groupCtaSub}>Find your community · {groups.length} groups available</Text>
                </View>
              </View>
              <ChevronRight size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── LATEST YOUTUBE VIDEOS ──────────────────────────────────── */}
        {videos.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="Latest from GKDI"
              onMore={() => Linking.openURL('https://www.youtube.com/@GKDIOfficial/videos')}
              moreLabel="YouTube ↗"
            />
            <FlatList
              horizontal
              data={videos}
              keyExtractor={v => v.videoId}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.videoList}
              renderItem={({ item }) => <YouTubeCard video={item} />}
              ListFooterComponent={<View style={{ width: Spacing.base }} />}
            />
          </View>
        ) : (
          /* YouTube not configured — show social links instead */
          <View style={styles.section}>
            <SectionHeader title="Follow Us" />
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => Linking.openURL('https://www.youtube.com/@GKDIOfficial/videos')}
              >
                <Youtube size={18} color="#FF0000" />
                <Text style={styles.socialBtnText}>YouTube</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => Linking.openURL('https://www.instagram.com/gkdiofficial')}
              >
                <Instagram size={18} color="#E1306C" />
                <Text style={styles.socialBtnText}>Instagram</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── CHURCH NEWS ───────────────────────────────────────────── */}
        {news.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Church News" />
            {news.map(n => <NewsCard key={n.id} news={n} />)}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, onMore, moreLabel = 'See all' }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onMore && (
        <TouchableOpacity onPress={onMore}>
          <Text style={styles.sectionMore}>{moreLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: Spacing.xxxl + 20 },

  // ── Hero
  hero: { height: 280, overflow: 'hidden' },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
    justifyContent: 'space-between',
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoBar: {
    flexDirection: 'row',
    gap: '6',
    alignItems: 'center',
  },
  heroLogo: { width: 36, height: 36 },
  gkdiLogo: { width: 80, height: 80 },
  notifBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBottom: { marginBottom: 4 },
  heroGreeting: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.75)', marginBottom: 3 },
  heroTitle: {
    fontSize: Typography.xxl, fontWeight: Typography.bold,
    color: Colors.white, letterSpacing: -0.5,
  },
  heroSub: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  bannerDots: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 6, marginTop: Spacing.sm,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { backgroundColor: Colors.white, width: 20, borderRadius: 3 },

  // ── Quick Actions 2×2 grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: (W - Spacing.base * 2 - Spacing.md) / 2,
    borderRadius: 16,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 0,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    letterSpacing: 0.2,
  },

  // ── Sections
  section: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.text,
  },
  sectionMore: {
    fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium,
  },

  // ── Group CTA
  groupCta: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primary, borderRadius: 18,
    padding: Spacing.base, gap: Spacing.md,
  },
  groupCtaLeft: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  groupCtaIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  groupCtaTitle: {
    fontSize: Typography.base, fontWeight: Typography.bold,
    color: Colors.white, marginBottom: 2,
  },
  groupCtaSub: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.65)' },

  // ── YouTube
  videoList: {
    paddingLeft: 0,
    paddingRight: Spacing.base,
  },

  // ── Social links (YouTube fallback)
  socialRow: { flexDirection: 'row', gap: Spacing.sm },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.surface,
    borderRadius: 12, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.divider,
  },
  socialBtnText: {
    fontSize: Typography.sm, fontWeight: Typography.semiBold, color: Colors.text,
  },
});
