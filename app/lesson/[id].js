import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Linking, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, ArrowLeft, Mic, Calendar, Clock, Tag } from 'lucide-react-native';
import { getLesson } from '../../src/services/lessonService';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function getYoutubeThumbnail(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
  if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  return null;
}

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getLesson(id);
      setLesson(data);
      setLoading(false);
    })();
  }, [id]);

  const handleWatch = () => {
    if (lesson?.videoUrl) Linking.openURL(lesson.videoUrl);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ArrowLeft size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ArrowLeft size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lesson</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingWrap}>
          <Text style={styles.errorText}>Lesson not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const thumbUrl = lesson.thumbnailUrl || getYoutubeThumbnail(lesson.videoUrl);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lesson</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Thumbnail + play overlay */}
        <TouchableOpacity style={styles.heroWrap} activeOpacity={0.85} onPress={handleWatch}>
          {thumbUrl ? (
            <Image source={{ uri: thumbUrl }} style={styles.heroImg} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Mic size={48} color={Colors.textLight} />
            </View>
          )}
          {lesson.videoUrl && (
            <View style={styles.playOverlay}>
              <View style={styles.playCircle}>
                <Play size={28} color={Colors.white} fill={Colors.white} />
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          {lesson.category && (
            <View style={styles.categoryBadge}>
              <Tag size={11} color={Colors.textSecondary} />
              <Text style={styles.categoryText}>{lesson.category}</Text>
            </View>
          )}

          <Text style={styles.title}>{lesson.title}</Text>

          <View style={styles.metaRow}>
            <Mic size={14} color={Colors.textLight} />
            <Text style={styles.metaText}>{lesson.speaker}</Text>
          </View>
          {lesson.date && (
            <View style={styles.metaRow}>
              <Calendar size={14} color={Colors.textLight} />
              <Text style={styles.metaText}>{formatDate(lesson.date)}</Text>
            </View>
          )}
          {lesson.duration && (
            <View style={styles.metaRow}>
              <Clock size={14} color={Colors.textLight} />
              <Text style={styles.metaText}>{lesson.duration}</Text>
            </View>
          )}

          <View style={styles.divider} />

          {lesson.description ? (
            <Text style={styles.description}>{lesson.description}</Text>
          ) : null}

          {lesson.videoUrl && (
            <TouchableOpacity style={styles.watchBtn} onPress={handleWatch} activeOpacity={0.85}>
              <Play size={18} color={Colors.white} fill={Colors.white} />
              <Text style={styles.watchBtnText}>Watch / Listen</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: { width: 40, padding: 4 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.md,
    fontWeight: Typography.semiBold,
    color: Colors.text,
  },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: Typography.base, color: Colors.textSecondary },

  scroll: { flex: 1, backgroundColor: Colors.surface },

  heroWrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: Colors.surfaceAlt, overflow: 'hidden' },
  heroImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { padding: Spacing.xl },

  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  categoryText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text,
    lineHeight: 30,
    marginBottom: Spacing.base,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  metaText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.lg,
  },

  description: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },

  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.base,
    borderRadius: 12,
    marginTop: Spacing.sm,
  },
  watchBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.white,
  },
});
