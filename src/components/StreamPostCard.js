import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, Pencil } from 'lucide-react-native';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';
import Avatar from './Avatar';
import FormattedText from './FormattedText';
import { formatRelativeTime } from '../utils/formatDate';
import { toggleLike, hasUserLiked } from '../services/streamService';

const CATEGORY_STYLE = {
  reflection: { bg: Colors.tagReflection, label: 'Reflection' },
  testimony: { bg: Colors.tagTestimony, label: 'Testimony' },
  prayer: { bg: Colors.tagPrayer, label: 'Prayer Request' },
  announcement: { bg: Colors.tagAnnouncement, label: 'Announcement' },
  general: { bg: Colors.tagGeneral, label: 'General' },
};

export default function StreamPostCard({ post, currentUserId }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [toggling, setToggling] = useState(false);

  const cat = CATEGORY_STYLE[post.category] || CATEGORY_STYLE.general;

  useEffect(() => {
    if (!currentUserId) return;
    hasUserLiked(post.id, currentUserId).then(setLiked);
  }, [post.id, currentUserId]);

  async function handleLike() {
    if (!currentUserId || toggling) return;
    setToggling(true);
    try {
      const nowLiked = await toggleLike(post.id, currentUserId);
      setLiked(nowLiked);
      setLikeCount(c => nowLiked ? c + 1 : c - 1);
    } finally {
      setToggling(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar uri={post.authorPhotoURL} name={post.authorName} size={40} />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.authorName}</Text>
          <Text style={styles.time}>
            {formatRelativeTime(post.createdAt)}{post.isEdited ? ' · edited' : ''}
          </Text>
        </View>
        <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
          <Text style={styles.catLabel}>{cat.label}</Text>
        </View>
        {post.authorId === currentUserId && (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push(`/stream/create?editId=${post.id}`)}
            hitSlop={8}
          >
            <Pencil size={14} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={() => router.push(`/stream/${post.id}`)} activeOpacity={0.9}>
        <FormattedText style={styles.content}>{post.content}</FormattedText>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} disabled={toggling}>
          <Heart
            size={18}
            color={liked ? Colors.error : Colors.textSecondary}
            fill={liked ? Colors.error : 'transparent'}
          />
          <Text style={[styles.actionCount, liked && styles.likedCount]}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/stream/${post.id}`)}>
          <MessageCircle size={18} color={Colors.textSecondary} />
          <Text style={styles.actionCount}>{post.commentCount || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.base,
    marginBottom: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md, gap: Spacing.sm },
  authorInfo: { flex: 1 },
  authorName: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: Colors.text },
  time: { fontSize: Typography.xs, color: Colors.textLight, marginTop: 2 },
  catBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  editBtn: { padding: 4, marginLeft: 2 },
  catLabel: { fontSize: 10, fontWeight: Typography.bold, color: Colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  content: { fontSize: Typography.base, color: Colors.text, lineHeight: Typography.base * 1.6, marginBottom: Spacing.md },
  actions: {
    flexDirection: 'row', gap: Spacing.base,
    paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 6 },
  actionCount: { fontSize: Typography.sm, color: Colors.textSecondary },
  likedCount: { color: Colors.error },
});
