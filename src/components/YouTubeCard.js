import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Linking } from 'react-native';
import { Play } from 'lucide-react-native';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';
import { formatRelativeTime } from '../utils/formatDate';

export default function YouTubeCard({ video }) {
  function openVideo() {
    Linking.openURL(video.url);
  }

  return (
    <TouchableOpacity style={styles.card} onPress={openVideo} activeOpacity={0.85}>
      <View style={styles.thumbnailWrap}>
        {video.thumbnail ? (
          <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={styles.thumbnailPlaceholder} />
        )}
        <View style={styles.playBtn}>
          <Play size={18} color={Colors.white} fill={Colors.white} />
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.meta}>{formatRelativeTime(video.publishedAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  thumbnailWrap: {
    position: 'relative',
    width: '100%',
    height: 124,
    backgroundColor: Colors.surfaceAlt,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceAlt,
  },
  playBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { padding: Spacing.sm },
  title: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.text,
    lineHeight: Typography.sm * 1.4,
    marginBottom: 4,
  },
  meta: {
    fontSize: Typography.xs,
    color: Colors.textLight,
  },
});
