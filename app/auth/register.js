import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, Image, ImageBackground, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { registerWithEmail } from '../../src/services/authService';
import InputField from '../../src/components/InputField';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

const { height: SCREEN_H } = Dimensions.get('window');
const BG_IMAGE = { uri: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' };

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Min. 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      await registerWithEmail({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      router.replace('/tabs/home');
    } catch (err) {
      Alert.alert('Registration Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            overScrollMode="never"
          >
            {/* Top hero */}
            <View style={styles.hero}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <ArrowLeft size={20} color={Colors.white} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <Image
                source={require('../../assets/logo-white.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.heroTitle}>Create Account</Text>
              <Text style={styles.heroSub}>Join your discipleship community</Text>
            </View>

            {/* Form card */}
            <View style={styles.card}>
              <InputField label="Full Name" value={form.fullName} onChangeText={v => set('fullName', v)} placeholder="Your full name" autoCapitalize="words" error={errors.fullName} />
              <InputField label="Email" value={form.email} onChangeText={v => set('email', v)} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" error={errors.email} />
              <InputField label="Phone Number" value={form.phone} onChangeText={v => set('phone', v)} placeholder="+62 8xx xxxx xxxx" keyboardType="phone-pad" autoCapitalize="none" error={errors.phone} />
              <InputField label="Password" value={form.password} onChangeText={v => set('password', v)} placeholder="Min. 6 characters" secureTextEntry error={errors.password} />
              <InputField label="Confirm Password" value={form.confirmPassword} onChangeText={v => set('confirmPassword', v)} placeholder="Repeat your password" secureTextEntry error={errors.confirmPassword} />

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnLoading]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
                {!loading && <ArrowRight size={18} color={Colors.white} />}
              </TouchableOpacity>

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.loginLink}> Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0D0D0D' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.52)' },
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'space-between', paddingBottom: Spacing.xl },
  hero: {
    paddingTop: SCREEN_H * 0.05,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginBottom: Spacing.xl,
  },
  backText: { fontSize: Typography.base, color: Colors.white, fontWeight: Typography.medium },
  logo: { width: 72, height: 72, marginBottom: Spacing.md },
  heroTitle: {
    fontSize: Typography.xl, fontWeight: Typography.bold,
    color: Colors.white, marginBottom: 4,
  },
  heroSub: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.65)' },
  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 15, marginTop: Spacing.sm,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 10, elevation: 4,
  },
  btnLoading: { opacity: 0.6 },
  btnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.white, letterSpacing: 0.3 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.lg },
  loginText: { fontSize: Typography.sm, color: Colors.textSecondary },
  loginLink: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.bold },
});
