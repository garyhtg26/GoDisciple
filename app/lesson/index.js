import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, RefreshControl, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Mic, BookOpen } from 'lucide-react-native';
import AppHeader from '../../src/components/AppHeader';
import LoadingState from '../../src/components/LoadingState';
import EmptyState from '../../src/components/EmptyState';
import { getLessons, getLessonCategories } from '../../src/services/lessonService';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function LessonCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.7}>
      <View style={styles.thumbnail}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbImg} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Mic size={24} color={Colors.textLight} />
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardSpeaker} numberOfLines={1}>{item.speaker}</Text>
        <Text style={styles.cardMeta}>
          {formatDate(item.date)}{item.duration ? `  ·  ${item.duration}` : ''}
        </Text>
      </View>
      <TouchableOpacity style={styles.playBtn} onPress={() => onPress(item)}>
        <Play size={16} color={Colors.white} fill={Colors.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function LessonScreen() {
  const router = useRouter();
  const [lessons, setLessons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (cat = null) => {
    try {
      const data = await getLessons({ category: cat });
      setLessons(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([
        load(null),
        getLessonCategories().then(setCategories),
      ]);
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(activeCategory);
    setRefreshing(false);
  };

  const handleCategory = async (cat) => {
    const next = cat === activeCategory ? null : cat;
    setActiveCategory(next);
    setLoading(true);
    await load(next);
    setLoading(false);
  };

  const handlePress = (item) => {
    router.push(`/lesson/${item.id}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Lesson" showBack />

      {/* Category filter */}
      {categories.length > 0 && (
        <View style={styles.filterWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterRow}
          >
            <TouchableOpacity
              style={[styles.chip, !activeCategory && styles.chipActive]}
              onPress={() => handleCategory(null)}
            >
              <Text style={[styles.chipText, !activeCategory && styles.chipTextActive]}>All</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, activeCategory === cat && styles.chipActive]}
                onPress={() => handleCategory(cat)}
              >
                <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <LoadingState />
      ) : lessons.length === 0 ? (
        <EmptyState
          IconComponent={BookOpen}
          title="No Lessons Yet"
          subtitle="Check back soon for new messages."
        />
      ) : (
        <FlatList
          data={lessons}
          keyExtractor={i => i.id}
          renderItem={({ item }) => <LessonCard item={item} onPress={handlePress} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const THUMB_W = 110;
const THUMB_H = 74;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  filterWrap: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  filterScroll: { flexGrow: 0, flexShrink: 0 },
  filterRow: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  chipTextActive: { color: Colors.white, fontWeight: Typography.semiBold },

  list: { paddingVertical: Spacing.sm, backgroundColor: Colors.surface },
  separator: { height: 1, backgroundColor: Colors.divider, marginLeft: THUMB_W + Spacing.base * 2 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  thumbnail: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceAlt,
    marginRight: Spacing.md,
  },
  thumbImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  cardBody: { flex: 1 },
  cardTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 3,
  },
  cardSpeaker: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  cardMeta: {
    fontSize: Typography.xs,
    color: Colors.textLight,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
});
