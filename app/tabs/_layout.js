import React from 'react';
import { Tabs } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Home, Sparkles, Users, User, QrCode } from 'lucide-react-native';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';

// ── Center FAB QR Button ────────────────────────────────────────────────────
function QRFabButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.fabWrap}
      onPress={() => router.push('/checkin/scanner')}
      activeOpacity={0.85}
    >
      <View style={styles.fab}>
        <QrCode size={26} color={Colors.white} strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stream"
        options={{
          title: 'Stream',
          tabBarIcon: ({ color, size }) => <Sparkles size={size ?? 22} color={color} />,
        }}
      />
      {/* Center QR FAB — no label, custom button */}
      <Tabs.Screen
        name="scan"
        options={{
          title: '',
          tabBarButton: () => <QRFabButton />,
        }}
      />
      <Tabs.Screen
        name="group"
        options={{
          title: 'Group',
          tabBarIcon: ({ color, size }) => <Users size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size ?? 22} color={color} />,
        }}
      />
      {/* Hidden tabs — keep for routing but don't show in tab bar */}
      <Tabs.Screen name="schedule" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopColor: Colors.divider,
    borderTopWidth: 1,
    height: 62,
    paddingBottom: 8,
    paddingTop: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: Typography.medium,
    marginTop: 1,
  },
  fabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Lift the FAB above the tab bar
    marginTop: -22,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 3,
    borderColor: Colors.white,
  },
});
