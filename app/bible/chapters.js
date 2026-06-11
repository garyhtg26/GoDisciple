import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../src/components/AppHeader';
import LoadingState from '../../src/components/LoadingState';
import { getChapters, VERSIONS } from '../../src/services/bibleService';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

const COLS = 5;

export default function ChaptersScreen() {
  const { bookId, bookName, version } = useLocalSearchParams();
  const router = useRouter();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChapters(version, bookId)
      .then(data => setChapters(data.filter(c => c.id !== `${bookId}.intro`)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [bookId, version]);

  const handleChapter = (ch) => {
    router.push({
      pathname: '/bible/read',
      params: { chapterId: ch.id, bookName, chapterNum: ch.number, version },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title={bookName} subtitle={VERSIONS[version]?.label} showBack />

      {loading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={chapters}
          keyExtractor={c => c.id}
          numColumns={COLS}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.cell} onPress={() => handleChapter(item)} activeOpacity={0.7}>
              <Text style={styles.cellText}>{item.number}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const CELL = 56;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  grid: { padding: Spacing.base, gap: 10 },
  row: { gap: 10, justifyContent: 'flex-start' },
  cell: {
    width: CELL, height: CELL,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cellText: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.text,
  },
});
