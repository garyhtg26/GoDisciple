import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';

export default function SecondaryButton({ title, onPress, loading = false, disabled = false, style, danger = false }) {
  return (
    <TouchableOpacity
      style={[styles.button, danger && styles.danger, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={danger ? Colors.error : Colors.primary} size="small" />
      ) : (
        <Text style={[styles.label, danger && styles.dangerLabel]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  danger: {
    backgroundColor: '#FFF0F0',
    borderColor: Colors.error,
  },
  disabled: { opacity: 0.45 },
  label: {
    color: Colors.primary,
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    letterSpacing: 0.3,
  },
  dangerLabel: { color: Colors.error },
});
