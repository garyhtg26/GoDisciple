import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Vibration } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Camera } from 'lucide-react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import { processCheckIn } from '../../src/services/checkInService';
import PrimaryButton from '../../src/components/PrimaryButton';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';

export default function ScannerScreen() {
  const router = useRouter();
  const { user, profile } = useAuthContext();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const lastScannedRef = useRef(null);

  async function handleBarCodeScanned({ data }) {
    if (scanned || processing) return;
    if (lastScannedRef.current === data) return;
    lastScannedRef.current = data;
    setScanned(true);
    setProcessing(true);
    Vibration.vibrate(100);

    try {
      const event = await processCheckIn(data, user.uid, profile?.groupId || null);
      Alert.alert(
        '✅ Check-in Successful!',
        `You have checked in to "${event.title || 'this event'}".`,
        [{ text: 'Done', onPress: () => router.back() }],
      );
    } catch (e) {
      Alert.alert('Check-in Failed', e.message || 'Could not process QR code.', [
        {
          text: 'Try Again',
          onPress: () => {
            setScanned(false);
            setProcessing(false);
            lastScannedRef.current = null;
          },
        },
        { text: 'Close', style: 'cancel', onPress: () => router.back() },
      ]);
    } finally {
      setProcessing(false);
    }
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.permSafe}>
        <Text style={styles.loadingText}>Requesting camera permission…</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permSafe}>
        <Camera size={48} color={Colors.primary} style={{ marginBottom: Spacing.base }} />
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permSub}>We need camera access to scan QR codes for check-in.</Text>
        <PrimaryButton title="Grant Camera Access" onPress={requestPermission} style={{ marginTop: Spacing.lg, width: '100%' }} />
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.scanner}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <X size={20} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.scanTitle}>QR Check-In</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Frame */}
        <View style={styles.frameArea}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        {/* Bottom hint */}
        <View style={styles.bottomArea}>
          <Text style={styles.scanHint}>
            {processing ? 'Processing…' : scanned ? 'Checking you in…' : 'Point your camera at the event QR code'}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const FRAME = 240;
const CORNER = 24;

const styles = StyleSheet.create({
  permSafe: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.base,
  },
  loadingText: { color: Colors.textSecondary },
  permTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text, textAlign: 'center' },
  permSub: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: Typography.base * 1.5 },
  cancelBtn: { paddingVertical: Spacing.sm, marginTop: Spacing.sm },
  cancelText: { color: Colors.textSecondary, fontSize: Typography.base },
  scanner: { flex: 1, backgroundColor: Colors.black },
  overlay: { ...StyleSheet.absoluteFillObject },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.base,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  scanTitle: { fontSize: Typography.md, fontWeight: Typography.semiBold, color: Colors.white },
  frameArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: FRAME, height: FRAME, position: 'relative' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: Colors.white },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
  bottomArea: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl, alignItems: 'center' },
  scanHint: { fontSize: Typography.base, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: Typography.base * 1.5 },
});
