import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import Colors from '../src/constants/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" backgroundColor={Colors.background} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="tabs" />
          <Stack.Screen name="group/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="group/requests" options={{ presentation: 'card' }} />
          <Stack.Screen name="group/manage" options={{ presentation: 'card' }} />
          <Stack.Screen name="stream/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="stream/create" options={{ presentation: 'modal' }} />
          <Stack.Screen name="bible-theme/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="bible-theme/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="checkin/scanner" options={{ presentation: 'modal' }} />
          <Stack.Screen name="profile/edit" options={{ presentation: 'modal' }} />
          <Stack.Screen name="profile/claim-code" options={{ presentation: 'modal' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
