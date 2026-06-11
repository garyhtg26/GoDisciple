import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, Image,
  ImageBackground, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { loginWithEmail } from '../../src/services/authService';
import InputField from '../../src/components/InputField';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

const { height: SCREEN_H } = Dimensions.get('window');

// Beautiful Christian / worship background from Unsplash
// Church interior with light rays — atmospheric, spiritual
const BG_IMAGE = { uri: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' };

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
      router.replace('/tabs/home');
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
      {/* Dark gradient overlay */}
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
            {/* Top — Logo + Brand */}
            <View style={styles.hero}>
              <Image
                source={require('../../assets/logo-white.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>Go Disciple</Text>
              <Text style={styles.appSubtitle}>To know God and make Him known.</Text>
            </View>

            {/* Bottom — Form Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardSub}>Sign in to your account</Text>

              <InputField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />
              <InputField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry
                error={errors.password}
              />

              {/* Sign In Button */}
              <TouchableOpacity
                style={[styles.signInBtn, loading && styles.signInBtnLoading]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={loading}
              >
                <Text style={styles.signInBtnText}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </Text>
                {!loading && <ArrowRight size={18} color={Colors.white} />}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.divider} />
              </View>

              {/* Google Button */}
              <TouchableOpacity
                style={styles.googleBtn}
                onPress={() =>
                  Alert.alert(
                    'Google Sign-In',
                    'Google Sign-In requires a development build. See README for setup instructions.',
                  )
                }
                activeOpacity={0.8}
              >
                <Image
                  source={require('../../assets/google-icon.png')}
                  style={styles.googleIcon}
                  resizeMode="contain"
                />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>

              {/* Register link */}
              <View style={styles.registerRow}>
                <Text style={styles.registerText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => router.push('/auth/register')}>
                  <Text style={styles.registerLink}> Create account</Text>
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
  bg: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // Gradient-like: darker at top, slightly lighter at bottom
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: SCREEN_H * 0.08,
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.base,
  },
  appName: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.3,
  },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },

  // Sign In button
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  signInBtnLoading: { opacity: 0.6 },
  signInBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.white,
    letterSpacing: 0.3,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.base,
    gap: Spacing.sm,
  },
  divider: { flex: 1, height: 1, backgroundColor: Colors.divider },
  dividerText: { fontSize: Typography.xs, color: Colors.textLight, letterSpacing: 0.5 },

  // Google button
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 13,
    backgroundColor: Colors.white,
  },
  googleIcon: { width: 20, height: 20 },
  googleBtnText: {
    fontSize: Typography.base,
    color: Colors.text,
    fontWeight: Typography.medium,
  },

  // Register
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  registerText: { fontSize: Typography.sm, color: Colors.textSecondary },
  registerLink: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.bold,
  },
});
