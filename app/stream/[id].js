import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc } from 'firebase/firestore';
import { Heart, MessageCircle, SendHorizonal, Pencil } from 'lucide-react-native';
import { db } from '../../src/firebase/config';
import { useAuthContext } from '../../src/context/AuthContext';
import { getComments, addComment, toggleLike, hasUserLiked } from '../../src/services/streamService';
import Avatar from '../../src/components/Avatar';
import FormattedText from '../../src/components/FormattedText';
import AppHeader from '../../src/components/AppHeader';
import LoadingState from '../../src/components/LoadingState';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';
import { formatRelativeTime } from '../../src/utils/formatDate';

const CATEGORY_LABEL = {
  reflection: 'Reflection', testimony: 'Testimony',
  prayer: 'Prayer Request', announcement: 'Announcement', general: 'General',
};

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, profile } = useAuthContext();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [toggling, setToggling] = useState(false);

  // reload on focus so edits made in the edit screen show up on return
  useFocusEffect(useCallback(() => { loadPost(); }, [id]));

  async function loadPost() {
    try {
      const snap = await getDoc(doc(db, 'streamPosts', id));
      if (snap.exists()) {
        const data = snap.data();
        setPost({ ...data, id: snap.id });
        setLikeCount(data.likeCount || 0);
      }
      const c = await getComments(id);
      setComments(c);
      if (user) setLiked(await hasUserLiked(id, user.uid));
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }

  async function handleLike() {
    if (!user || toggling) return;
    setToggling(true);
    try {
      const nowLiked = await toggleLike(id, user.uid);
      setLiked(nowLiked);
      setLikeCount(c => nowLiked ? c + 1 : c - 1);
    } catch (e) {
      console.warn(e);
    } finally { setToggling(false); }
  }

  async function handleSubmitComment() {
    if (!comment.trim() || !user) return;
    setSubmitting(true);
    try {
      await addComment(id, {
        authorId: user.uid,
        authorName: profile?.fullName || user.email,
        authorPhotoURL: profile?.photoURL || null,
        content: comment.trim(),
      });
      setComment('');
      const c = await getComments(id);
      setComments(c);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not post comment.');
    } finally { setSubmitting(false); }
  }

  if (loading) return <LoadingState />;
  if (!post) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Post" showBack />
      <View style={styles.center}><Text>Post not found.</Text></View>
    </SafeAreaView>
  );

  const isOwnPost = post.authorId === user?.uid;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader
        title="Post"
        showBack
        right={isOwnPost ? (
          <TouchableOpacity onPress={() => router.push(`/stream/create?editId=${post.id}`)} hitSlop={8}>
            <Pencil size={18} color={Colors.primary} />
          </TouchableOpacity>
        ) : null}
      />
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Post */}
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <Avatar uri={post.authorPhotoURL} name={post.authorName} size={44} />
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{post.authorName}</Text>
                <Text style={styles.postTime}>
                  {formatRelativeTime(post.createdAt)}{post.isEdited ? ' · edited' : ''}
                </Text>
              </View>
              <View style={styles.catBadge}>
                <Text style={styles.catText}>{CATEGORY_LABEL[post.category] || post.category}</Text>
              </View>
            </View>
            <FormattedText style={styles.postContent}>{post.content}</FormattedText>
            <View style={styles.postStats}>
              <TouchableOpacity style={styles.statRow} onPress={handleLike} disabled={toggling} hitSlop={6}>
                <Heart
                  size={16}
                  color={liked ? Colors.error : Colors.textSecondary}
                  fill={liked ? Colors.error : 'transparent'}
                />
                <Text style={[styles.statText, liked && styles.likedText]}>{likeCount} likes</Text>
              </TouchableOpacity>
              <View style={styles.statRow}>
                <MessageCircle size={14} color={Colors.textSecondary} />
                <Text style={styles.statText}>{post.commentCount || 0} comments</Text>
              </View>
            </View>
          </View>

          {/* Comments */}
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
          {comments.map(c => (
            <View key={c.id} style={styles.commentCard}>
              <Avatar uri={c.authorPhotoURL} name={c.authorName} size={34} />
              <View style={styles.commentBody}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{c.authorName}</Text>
                  <Text style={styles.commentTime}>{formatRelativeTime(c.createdAt)}</Text>
                </View>
                <FormattedText style={styles.commentText}>{c.content}</FormattedText>
              </View>
            </View>
          ))}
          {comments.length === 0 && (
            <Text style={styles.noComments}>Be the first to comment ✍️</Text>
          )}
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.inputRow}>
          <Avatar uri={profile?.photoURL} name={profile?.fullName} size={34} />
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Write a comment…"
            placeholderTextColor={Colors.textLight}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!comment.trim() || submitting) && styles.sendBtnDisabled]}
            onPress={handleSubmitComment}
            disabled={!comment.trim() || submitting}
          >
            <SendHorizonal size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  postCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.base, marginBottom: Spacing.base,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.md },
  authorInfo: { flex: 1 },
  authorName: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.text },
  postTime: { fontSize: Typography.xs, color: Colors.textLight, marginTop: 2 },
  catBadge: { backgroundColor: Colors.primaryLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  catText: { fontSize: 10, color: Colors.primary, fontWeight: Typography.bold, textTransform: 'uppercase' },
  postContent: { fontSize: Typography.base, color: Colors.text, lineHeight: Typography.base * 1.7, marginBottom: Spacing.md },
  postStats: { flexDirection: 'row', gap: Spacing.base, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: Typography.sm, color: Colors.textSecondary },
  likedText: { color: Colors.error },
  commentsTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.md },
  commentCard: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, alignItems: 'flex-start' },
  commentBody: { flex: 1, backgroundColor: Colors.surfaceAlt, borderRadius: 12, padding: Spacing.sm },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  commentAuthor: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: Colors.text },
  commentTime: { fontSize: Typography.xs, color: Colors.textLight },
  commentText: { fontSize: Typography.sm, color: Colors.text, lineHeight: Typography.sm * 1.5 },
  noComments: { textAlign: 'center', fontSize: Typography.sm, color: Colors.textLight, paddingVertical: Spacing.xl },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    padding: Spacing.sm, paddingBottom: Platform.OS === 'ios' ? Spacing.base : Spacing.sm,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  input: {
    flex: 1, fontSize: Typography.base, color: Colors.text,
    backgroundColor: Colors.surfaceAlt, borderRadius: 20,
    paddingHorizontal: Spacing.base, paddingVertical: 8, maxHeight: 100,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
