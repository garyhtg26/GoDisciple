import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PenSquare, Sparkles } from 'lucide-react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import { getPosts } from '../../src/services/streamService';
import StreamPostCard from '../../src/components/StreamPostCard';
import LoadingState from '../../src/components/LoadingState';
import EmptyState from '../../src/components/EmptyState';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'reflection', label: 'Reflections' },
  { key: 'testimony', label: 'Testimony' },
  { key: 'prayer', label: 'Prayer' },
  { key: 'announcement', label: 'Church' },
  { key: 'general', label: 'General' },
];

export default function StreamScreen() {
  const router = useRouter();
  const { user, profile } = useAuthContext();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  async function loadPosts(reset = false) {
    try {
      const cat = filter === 'all' ? null : filter;
      const groupFilter = filter === 'myGroup' ? profile?.groupId : null;
      const { posts: newPosts, lastDoc: ld } = await getPosts(cat, groupFilter, reset ? null : lastDoc);
      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setLastDoc(ld);
      setHasMore(newPosts.length === 15);
    } catch (e) {
      console.warn('Stream load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }

  // reload whenever the tab regains focus (e.g. after creating or editing a post)
  useFocusEffect(useCallback(() => { setLastDoc(null); loadPosts(true); }, [filter]));
  const onRefresh = useCallback(() => { setRefreshing(true); setLastDoc(null); loadPosts(true); }, [filter]);

  function onEndReached() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    loadPosts(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Stream</Text>
        <TouchableOpacity style={styles.composeBtn} onPress={() => router.push('/stream/create')}>
          <PenSquare size={16} color={Colors.white} />
          <Text style={styles.composeBtnText}>Post</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={i => i.key}
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, filter === item.key && styles.chipActive]}
            onPress={() => setFilter(item.key)}
          >
            <Text style={[styles.chipText, filter === item.key && styles.chipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <EmptyState
              IconComponent={Sparkles}
              title="No posts yet"
              subtitle="Be the first to share a reflection or testimony."
            />
          }
          ListFooterComponent={loadingMore ? <LoadingState label="Loading more…" /> : null}
          renderItem={({ item }) => (
            <StreamPostCard post={item} currentUserId={user?.uid} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  title: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.text },
  composeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: 20,
    paddingHorizontal: Spacing.base, paddingVertical: 7,
  },
  composeBtnText: { fontSize: Typography.sm, color: Colors.white, fontWeight: Typography.semiBold },
  filterScroll: { flexGrow: 0, flexShrink: 0 },
  filterList: { paddingHorizontal: Spacing.base, paddingVertical: 8, gap: 8, alignItems: 'center' },
  chip: {
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: Typography.medium, lineHeight: 18 },
  chipTextActive: { color: Colors.white },
  list: { padding: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.xxxl },
});
