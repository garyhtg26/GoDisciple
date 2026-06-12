import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile } from 'firebase/auth';
import { useAuthContext } from '../../src/context/AuthContext';
import { updateUserProfile } from '../../src/services/userService';
import { uploadImage } from '../../src/services/imageUploadService';
import { auth } from '../../src/firebase/config';
import InputField from '../../src/components/InputField';
import PrimaryButton from '../../src/components/PrimaryButton';
import Avatar from '../../src/components/Avatar';
import AppHeader from '../../src/components/AppHeader';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuthContext();

  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [photoURI, setPhotoURI] = useState(profile?.photoURL || null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [saving, setSaving] = useState(false);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      setPhotoURI(result.assets[0].uri);       // local preview
      setPhotoBase64(result.assets[0].base64); // payload for upload on save
    }
  }

  async function handleSave() {
    if (!fullName.trim()) { Alert.alert('Validation', 'Full name is required.'); return; }
    setSaving(true);
    try {
      let photoURL = profile?.photoURL || null;
      if (photoBase64) {
        photoURL = await uploadImage(photoBase64);
      }

      await updateUserProfile(user.uid, { fullName: fullName.trim(), phone: phone.trim(), photoURL });
      await updateProfile(auth.currentUser, { displayName: fullName.trim(), photoURL });
      await refreshProfile();

      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not update profile.');
    } finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Edit Profile" showBack />
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <Avatar uri={photoURI} name={fullName} size={90} />
            <TouchableOpacity onPress={pickPhoto} style={styles.changePhotoBtn}>
              <Camera size={15} color={Colors.primary} />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
            <Text style={styles.photoNote}>
              Square photos look best. Your photo is uploaded when you save.
            </Text>
          </View>

          <InputField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your full name" autoCapitalize="words" />
          <InputField label="Phone Number" value={phone} onChangeText={setPhone} placeholder="+62 8xx xxxx xxxx" keyboardType="phone-pad" autoCapitalize="none" />

          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Email</Text>
            <Text style={styles.readOnlyValue}>{user?.email}</Text>
            <Text style={styles.readOnlyNote}>Email cannot be changed here</Text>
          </View>

          <PrimaryButton title="Save Changes" onPress={handleSave} loading={saving} style={styles.saveBtn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  changePhotoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: Spacing.sm, paddingHorizontal: Spacing.base, paddingVertical: 6,
    backgroundColor: Colors.primaryLight, borderRadius: 8,
  },
  changePhotoText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semiBold },
  photoNote: {
    fontSize: Typography.xs, color: Colors.textLight, textAlign: 'center',
    marginTop: Spacing.sm, lineHeight: Typography.xs * 1.6,
  },
  readOnlyField: {
    marginBottom: Spacing.base, padding: Spacing.md,
    backgroundColor: Colors.surfaceAlt, borderRadius: 12,
  },
  readOnlyLabel: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.text, marginBottom: 4 },
  readOnlyValue: { fontSize: Typography.base, color: Colors.textSecondary },
  readOnlyNote: { fontSize: Typography.xs, color: Colors.textLight, marginTop: 2 },
  saveBtn: { marginTop: Spacing.sm },
});
