import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SectionList, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, ChevronRight } from 'lucide-react-native';
import AppHeader from '../../src/components/AppHeader';
import LoadingState from '../../src/components/LoadingState';
import { getBooks, VERSIONS } from '../../src/services/bibleService';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

// OT ends at Malachi (MAL), NT starts at Matthew (MAT)
const NT_START = 'MAT';

function groupBooks(books) {
  const ot = [], nt = [];
  let ntStarted = false;
  for (const b of books) {
    if (b.id === NT_START) ntStarted = true;
    if (ntStarted) nt.push(b); else ot.push(b);
  }
  return [
    { title: 'Perjanjian Lama', data: ot },
    { title: 'Perjanjian Baru', data: nt },
  ].filter(s => s.data.length > 0);
}

export default function BibleIndexScreen() {
  const router = useRouter();
  const [version, setVersion] = useState('TSI');
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (v) => {
    try {
      const books = await getBooks(v);
      setSections(groupBooks(books));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(version).finally(() => setLoading(false));
  }, [version, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(version);
    setRefreshing(false);
  };

  const handleBook = (book) => {
    router.push({ pathname: '/bible/chapters', params: { bookId: book.id, bookName: book.name, version } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Alkitab" showBack />

      {/* Version toggle */}
      <View style={styles.toggleWrap}>
        {Object.keys(VERSIONS).map(key => (
          <TouchableOpacity
            key={key}
            style={[styles.toggleBtn, version === key && styles.toggleActive]}
            onPress={() => setVersion(key)}
          >
            <Text style={[styles.toggleText, version === key && styles.toggleTextActive]}>
              {VERSIONS[key].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.versionName}>{VERSIONS[version].name}</Text>

      {loading ? (
        <LoadingState />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => handleBook(item)} activeOpacity={0.6}>
              <BookOpen size={16} color={Colors.textLight} />
              <Text style={styles.bookName}>{item.name}</Text>
              <View style={styles.chapterCount}>
                <Text style={styles.chapterCountText}>{item.chapters?.length ?? ''}</Text>
              </View>
              <ChevronRight size={16} color={Colors.textLight} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },

  toggleWrap: {
    flexDirection: 'row',
    margin: Spacing.base,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: Colors.primary },
  toggleText: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: Colors.textSecondary },
  toggleTextActive: { color: Colors.white },

  versionName: {
    fontSize: Typography.xs,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  sectionHeader: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  bookName: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.text,
  },
  chapterCount: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chapterCountText: {
    fontSize: Typography.xs,
    color: Colors.textLight,
    fontWeight: Typography.medium,
  },
  sep: { height: 1, backgroundColor: Colors.divider, marginLeft: Spacing.base + 16 + 10 },
});
