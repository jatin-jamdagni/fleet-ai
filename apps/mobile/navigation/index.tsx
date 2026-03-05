import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";

import { useAuthStore } from "../store/auth.store";
import { C } from "../components/UI";

import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import AIScreen from "../screens/AIScreen";
import TripsScreen from "../screens/TripsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SafetyScreen from "@/screens/SafetyScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Tab Icon ─────────────────────────────────────────────────────────────────

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    HOME: "◉",
    AI: "✦",
    TRIPS: "≡",
    PROFILE: "◎",
    SAFETY: "◈",
  };

  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      <Text style={{
        fontSize: 16,
        color: focused ? C.amber : C.faint,
      }}>
        {icons[label] ?? "·"}
      </Text>
      <Text style={{
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 1,
        color: focused ? C.amber : C.faint,
      }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Authenticated Tabs ───────────────────────────────────────────────────────

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#000",
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
          paddingTop: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="HOME" focused={focused} /> }}
      />
      <Tab.Screen
        name="AI"
        component={AIScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="AI" focused={focused} /> }}
      />
      <Tab.Screen
        name="Trips"
        component={TripsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="TRIPS" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="PROFILE" focused={focused} /> }}
      />
      <Tab.Screen
        name="Safety"
        component={SafetyScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="SAFETY" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────

export function RootNavigator() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  if (!hydrated) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: C.bg,
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Text style={{
          color: C.amber,
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 4,
        }}>
          FLEET AI
        </Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="App" component={AppTabs} />
      )}
    </Stack.Navigator>
  );
}
