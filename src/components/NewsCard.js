import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';
import { formatDate } from '../utils/formatDate';

export default function NewsCard({ news, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85} disabled={!onPress}>
      {news.imageURL ? (
        <Image source={{ uri: news.imageURL }} style={styles.image} />
      ) : null}
      <View style={styles.content}>
        <Text style={styles.category}>{news.category || 'NEWS'}</Text>
        <Text style={styles.title} numberOfLines={2}>{news.title}</Text>
        {news.excerpt ? (
          <Text style={styles.excerpt} numberOfLines={3}>{news.excerpt}</Text>
        ) : null}
        <Text style={styles.date}>{formatDate(news.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
    backgroundColor: Colors.surfaceAlt,
  },
  content: { padding: Spacing.base },
  category: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: Typography.md,
    fontWeight: Typography.semiBold,
    color: Colors.text,
    marginBottom: 6,
    lineHeight: Typography.md * 1.4,
  },
  excerpt: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.6,
    marginBottom: 8,
  },
  date: {
    fontSize: Typography.xs,
    color: Colors.textLight,
  },
});
