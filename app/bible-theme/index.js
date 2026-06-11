import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen } from 'lucide-react-native';
import { getBibleThemes } from '../../src/services/cmsService';
import BibleThemeCard from '../../src/components/BibleThemeCard';
import AppHeader from '../../src/components/AppHeader';
import LoadingState from '../../src/components/LoadingState';
import EmptyState from '../../src/components/EmptyState';
import Spacing from '../../src/constants/spacing';
import Colors from '../../src/constants/colors';

export default function BibleThemeListScreen() {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBibleThemes()
      .then(setThemes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Bible Themes" showBack />
      {loading ? (
        <LoadingState />
      ) : themes.length === 0 ? (
        <EmptyState
          IconComponent={BookOpen}
          title="No themes yet"
          subtitle="Bible themes will appear here when set by your church admin."
        />
      ) : (
        <FlatList
          data={themes}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <BibleThemeCard theme={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
});
