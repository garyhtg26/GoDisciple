import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, ArrowLeft, Settings2 } from 'lucide-react-native';
import { getChapter, getChapters, parseVerses, VERSIONS } from '../../src/services/bibleService';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

const FONT_SIZES = [14, 16, 18, 20, 22];

export default function ReadScreen() {
  const { chapterId: initChapterId, bookName, chapterNum, version, highlight } = useLocalSearchParams();
  const router = useRouter();
  const scrollRef = useRef(null);

  const [chapterId, setChapterId] = useState(initChapterId);
  const [currentChapterNum, setCurrentChapterNum] = useState(Number(chapterNum));
  const [currentBookName, setCurrentBookName] = useState(bookName);
  const [verses, setVerses] = useState([]);
  const [allChapters, setAllChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(1); // index into FONT_SIZES
  const [showSettings, setShowSettings] = useState(false);
  // TSI is missing 18 OT books (Job, Psalms, Daniel, …) — fall back to KJV
  // automatically when a chapter 404s, and tell the reader why.
  const [activeVersion, setActiveVersion] = useState(version || 'TSI');
  const [fellBack, setFellBack] = useState(false);
  // verse to highlight (from a tapped reference); cleared on chapter change
  const [highlightVerse, setHighlightVerse] = useState(highlight ? parseInt(highlight, 10) : null);

  // verse numbers can be ranges in TSI, e.g. "1-2"
  function isHighlighted(verseNum) {
    if (!highlightVerse) return false;
    const m = String(verseNum).match(/^(\d+)(?:-(\d+))?$/);
    if (!m) return false;
    const start = +m[1], end = m[2] ? +m[2] : start;
    return highlightVerse >= start && highlightVerse <= end;
  }

  // bookId from chapterId e.g. "GEN.1" → "GEN"
  const bookId = chapterId.split('.').slice(0, -1).join('.');

  useEffect(() => {
    getChapters(activeVersion, bookId)
      .then(data => setAllChapters(data.filter(c => !c.id.endsWith('.intro'))))
      .catch(console.warn);
  }, [bookId, activeVersion]);

  const loadChapter = useCallback(async (cid) => {
    setLoading(true);
    setVerses([]);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    try {
      const data = await getChapter(activeVersion, cid);
      const parsed = parseVerses(data.content);
      setVerses(parsed);
      setCurrentChapterNum(Number(data.number));
      setCurrentBookName(data.bookId ? data.reference?.split(' ').slice(0, -1).join(' ') : currentBookName);
    } catch (e) {
      if (activeVersion === 'TSI') {
        // book not available in TSI — switch to KJV; effect below reloads
        setFellBack(true);
        setActiveVersion('KJV');
        return;
      }
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [activeVersion, currentBookName]);

  useEffect(() => {
    loadChapter(chapterId);
  }, [chapterId, loadChapter]);

  const currentIdx = allChapters.findIndex(c => c.id === chapterId);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < allChapters.length - 1;

  const goChapter = (idx) => {
    const ch = allChapters[idx];
    if (ch) {
      setHighlightVerse(null);
      setChapterId(ch.id);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={8}>
          <ArrowLeft size={22} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerBook}>{currentBookName}</Text>
          <Text style={styles.headerChapter}>{VERSIONS[activeVersion]?.label} · Pasal {currentChapterNum}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowSettings(s => !s)} style={styles.headerBtn} hitSlop={8}>
          <Settings2 size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Font size settings */}
      {showSettings && (
        <View style={styles.settingsBar}>
          <Text style={styles.settingsLabel}>Ukuran Teks</Text>
          <View style={styles.fontBtns}>
            {FONT_SIZES.map((sz, i) => (
              <TouchableOpacity
                key={sz}
                style={[styles.fontBtn, fontSize === i && styles.fontBtnActive]}
                onPress={() => { setFontSize(i); setShowSettings(false); }}
              >
                <Text style={[styles.fontBtnText, { fontSize: sz - 4 }, fontSize === i && styles.fontBtnTextActive]}>A</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {fellBack && (
            <View style={styles.fallbackNote}>
              <Text style={styles.fallbackNoteText}>
                Kitab ini belum tersedia di TSI — menampilkan KJV (English).
              </Text>
            </View>
          )}
          <Text style={[styles.chapterTitle]}>
            {currentBookName} {currentChapterNum}
          </Text>
          {verses.map((v, idx) => {
            const hl = isHighlighted(v.number);
            return (
              <Text
                key={idx}
                style={[
                  styles.verse,
                  { fontSize: FONT_SIZES[fontSize], lineHeight: FONT_SIZES[fontSize] * 1.85 },
                  hl && styles.verseHighlight,
                ]}
                onLayout={hl ? (e => {
                  const y = e.nativeEvent.layout.y;
                  scrollRef.current?.scrollTo({ y: Math.max(0, y - 90), animated: true });
                }) : undefined}
              >
                <Text style={styles.verseNum}>{v.number}  </Text>
                {v.text}
              </Text>
            );
          })}
          {verses.length === 0 && (
            <Text style={styles.emptyText}>Konten tidak tersedia untuk pasal ini.</Text>
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* Prev / Next navigation */}
      {allChapters.length > 0 && (
        <View style={styles.navBar}>
          <TouchableOpacity
            style={[styles.navBtn, !hasPrev && styles.navBtnDisabled]}
            onPress={() => goChapter(currentIdx - 1)}
            disabled={!hasPrev}
          >
            <ChevronLeft size={20} color={hasPrev ? Colors.primary : Colors.textLight} />
            <Text style={[styles.navBtnText, !hasPrev && styles.navBtnTextDisabled]}>Sebelumnya</Text>
          </TouchableOpacity>

          <View style={styles.navDivider} />

          <TouchableOpacity
            style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
            onPress={() => goChapter(currentIdx + 1)}
            disabled={!hasNext}
          >
            <Text style={[styles.navBtnText, !hasNext && styles.navBtnTextDisabled]}>Berikutnya</Text>
            <ChevronRight size={20} color={hasNext ? Colors.primary : Colors.textLight} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerBtn: { width: 40, padding: 4, alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerBook: { fontSize: Typography.md, fontWeight: Typography.semiBold, color: Colors.text },
  headerChapter: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 1 },

  settingsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: Spacing.md,
  },
  settingsLabel: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  fontBtns: { flexDirection: 'row', gap: 8 },
  fontBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  fontBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  fontBtnText: { color: Colors.text, fontWeight: Typography.bold },
  fontBtnTextActive: { color: Colors.white },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  chapterTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  verse: {
    color: Colors.text,
    marginBottom: 4,
  },
  verseHighlight: {
    backgroundColor: '#FBF3D0',   // soft highlighter yellow
    borderRadius: 4,
  },
  fallbackNote: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fallbackNoteText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.xs * 1.6,
  },
  verseNum: {
    fontWeight: Typography.bold,
    color: Colors.textLight,
    fontSize: 11,
  },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xxl },

  navBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  navBtn: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: 4,
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: Colors.primary },
  navBtnTextDisabled: { color: Colors.textLight },
  navDivider: { width: 1, backgroundColor: Colors.divider, marginVertical: 10 },
});
