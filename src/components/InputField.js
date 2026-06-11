import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import Spacing from '../constants/spacing';

export default function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  error,
  style,
  inputStyle,
}) {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(secureTextEntry);

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, focused && styles.focused, error && styles.errored]}>
        <TextInput
          style={[styles.input, multiline && { height: numberOfLines * 22 + 16 }, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setSecure(!secure)} hitSlop={8} style={styles.eyeBtn}>
            {secure
              ? <Eye size={18} color={Colors.textLight} />
              : <EyeOff size={18} color={Colors.textLight} />
            }
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.base },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.text,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: Spacing.base,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  focused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  errored: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.text,
    paddingVertical: Spacing.md,
  },
  eyeBtn: { paddingLeft: Spacing.sm },
  error: {
    fontSize: Typography.xs,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});
