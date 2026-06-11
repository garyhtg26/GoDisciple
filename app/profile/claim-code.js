import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyRound } from 'lucide-react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import { claimLeaderCode } from '../../src/services/groupService';
import AppHeader from '../../src/components/AppHeader';
import InputField from '../../src/components/InputField';
import PrimaryButton from '../../src/components/PrimaryButton';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

export default function ClaimCodeScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuthContext();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleClaim() {
    if (!code.trim()) { Alert.alert('Validation', 'Please enter a leader code.'); return; }
    setLoading(true);
    try {
      const { groupId, role } = await claimLeaderCode(code.trim().toUpperCase(), user.uid);
      await refreshProfile();
      Alert.alert(
        'Code Claimed!',
        `You are now a ${role === 'leader' ? 'Group Leader' : 'Co-Leader'} and have been assigned to your group.`,
        [{ text: 'Go to Group', onPress: () => { router.back(); router.push(`/group/${groupId}`); } }],
      );
    } catch (e) {
      Alert.alert('Invalid Code', e.message || 'The code you entered is invalid or has already been used.');
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Claim Leader Code" showBack />
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.infoBox}>
            <View style={styles.iconCircle}>
              <KeyRound size={32} color={Colors.primaryDark} />
            </View>
            <Text style={styles.infoTitle}>Leader Claim Code</Text>
            <Text style={styles.infoBody}>
              If your church admin has given you a leader code, enter it here to become a Group Leader or Co-Leader and be assigned to your group.
            </Text>
          </View>

          <InputField
            label="Leader Code"
            value={code}
            onChangeText={setCode}
            placeholder="e.g. LEAD-ABC123"
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <PrimaryButton title="Claim Code" onPress={handleClaim} loading={loading} style={styles.btn} />

          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              Leader codes are issued by church admins via the Admin CMS. Contact your cell group coordinator if you haven't received yours.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  infoBox: {
    backgroundColor: Colors.primaryLight, borderRadius: 16,
    padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  infoTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.primaryDark, marginBottom: Spacing.sm, textAlign: 'center' },
  infoBody: { fontSize: Typography.sm, color: Colors.primaryDark, textAlign: 'center', lineHeight: Typography.sm * 1.6 },
  btn: { marginTop: Spacing.sm },
  noteBox: { marginTop: Spacing.xl, backgroundColor: Colors.surfaceAlt, borderRadius: 12, padding: Spacing.base },
  noteText: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: Typography.sm * 1.6 },
});
