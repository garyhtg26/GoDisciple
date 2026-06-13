import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Send, BookOpen, HandMetal, Heart, MessageCircle, Globe, Users } from 'lucide-react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import { createPost, getPost, updatePost } from '../../src/services/streamService';
import InputField from '../../src/components/InputField';
import PrimaryButton from '../../src/components/PrimaryButton';
import Avatar from '../../src/components/Avatar';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

const CATEGORIES = [
  { key: 'reflection', label: 'Reflection',     Icon: BookOpen },
  { key: 'testimony',  label: 'Testimony',      Icon: HandMetal },
  { key: 'prayer',     label: 'Prayer Request', Icon: Heart },
  { key: 'general',    label: 'General',        Icon: MessageCircle },
];

const VISIBILITY = [
  { key: 'public', label: 'Public',   Icon: Globe },
  { key: 'group',  label: 'My Group', Icon: Users },
];

export default function CreatePostScreen() {
  const router = useRouter();
  const { editId, prefill, category: prefillCategory } = useLocalSearchParams();
  const { user, profile } = useAuthContext();
  const [content, setContent] = useState(prefill || '');
  const [category, setCategory] = useState(prefillCategory || 'reflection');
  const [visibility, setVisibility] = useState('public');
  const [posting, setPosting] = useState(false);

  const isEditing = !!editId;

  useEffect(() => {
    if (!editId) return;
    getPost(editId).then(post => {
      if (!post) { Alert.alert('Error', 'Post not found.'); router.back(); return; }
      if (post.authorId !== user?.uid) { Alert.alert('Error', 'You can only edit your own posts.'); router.back(); return; }
      setContent(post.content || '');
      setCategory(post.category || 'general');
      setVisibility(post.visibility || 'public');
    });
  }, [editId]);

  async function handlePost() {
    if (!content.trim()) { Alert.alert('Validation', 'Post content cannot be empty.'); return; }
    if (!user) return;
    setPosting(true);
    try {
      if (isEditing) {
        await updatePost(editId, {
          content: content.trim(),
          category,
          visibility,
          groupId: visibility === 'group' ? (profile?.groupId || null) : null,
        });
      } else {
        await createPost({
          authorId: user.uid,
          authorName: profile?.fullName || user.email,
          authorPhotoURL: profile?.photoURL || null,
          content: content.trim(),
          category,
          visibility,
          groupId: visibility === 'group' ? (profile?.groupId || null) : null,
        });
      }
      router.back();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save post.');
    } finally { setPosting(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topBarBtn}>
          <X size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{isEditing ? 'Edit Post' : 'New Post'}</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={posting || !content.trim()}
          style={[styles.postBtn, (!content.trim() || posting) && styles.postBtnDisabled]}
        >
          <Send size={14} color={Colors.white} />
          <Text style={styles.postBtnText}>{posting ? '…' : isEditing ? 'Save' : 'Post'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Author row */}
          <View style={styles.authorRow}>
            <Avatar uri={profile?.photoURL} name={profile?.fullName} size={46} />
            <View>
              <Text style={styles.authorName}>{profile?.fullName || 'Member'}</Text>
              <Text style={styles.postingAs}>{isEditing ? 'Editing your post' : 'Posting to stream'}</Text>
            </View>
          </View>

          {/* Content */}
          <InputField
            value={content}
            onChangeText={setContent}
            placeholder="Share a reflection, testimony, or prayer request…"
            multiline
            numberOfLines={8}
            inputStyle={styles.contentInput}
          />
          <Text style={styles.formatHint}>
            Format: *bold*  _italic_  ~strikethrough~
          </Text>

          {/* Category */}
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.chips}>
            {CATEGORIES.map(c => {
              const active = category === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategory(c.key)}
                >
                  <c.Icon size={14} color={active ? Colors.white : Colors.textSecondary} />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Visibility */}
          <Text style={styles.sectionLabel}>Visibility</Text>
          <View style={styles.chips}>
            {VISIBILITY.map(v => {
              const active = visibility === v.key;
              const disabled = v.key === 'group' && !profile?.groupId;
              return (
                <TouchableOpacity
                  key={v.key}
                  style={[styles.chip, active && styles.chipActive, disabled && styles.chipDisabled]}
                  onPress={() => !disabled && setVisibility(v.key)}
                  disabled={disabled}
                >
                  <v.Icon size={14} color={active ? Colors.white : Colors.textSecondary} />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{v.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <PrimaryButton title={isEditing ? 'Save Changes' : 'Share Post'} onPress={handlePost} loading={posting} style={styles.shareBtn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.divider, backgroundColor: Colors.surface,
  },
  topBarBtn: { padding: 4 },
  topTitle: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.text },
  postBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primary, borderRadius: 20,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { fontSize: Typography.sm, color: Colors.white, fontWeight: Typography.bold },
  kav: { flex: 1 },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.base },
  authorName: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.text },
  postingAs: { fontSize: Typography.xs, color: Colors.textLight },
  contentInput: { fontSize: Typography.md, minHeight: 120 },
  formatHint: {
    fontSize: Typography.xs, color: Colors.textLight,
    marginTop: -Spacing.xs, marginBottom: Spacing.base,
  },
  sectionLabel: {
    fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textSecondary,
    marginBottom: Spacing.sm, marginTop: Spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.base },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: Colors.surfaceAlt, borderWidth: 1.5, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipDisabled: { opacity: 0.4 },
  chipText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  chipTextActive: { color: Colors.white },
  shareBtn: { marginTop: Spacing.lg },
});
