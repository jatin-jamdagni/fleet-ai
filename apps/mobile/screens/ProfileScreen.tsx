import React, { useState } from "react";
import {
  View, Text, ScrollView, Alert, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../store/auth.store";
import { authApi, api } from "../lib/api";
import { driverWS } from "../lib/ws";
import { Card, Btn, Field, SectionLabel, StatRow, Divider, C } from "../components/UI";

export default function ProfileScreen() {
  const user      = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd,     setNewPwd]     = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert("LOGOUT", "Sign out of Fleet AI?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try { await authApi.logout(); } catch { /* ignore */ }
          await clearAuth();
          driverWS.disconnect();
        },
      },
    ]);
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd) {
      Alert.alert("Error", "Enter both passwords");
      return;
    }
    if (newPwd.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters");
      return;
    }

    setPwdLoading(true);
    try {
      await api.post("/users/me/change-password", {
        currentPassword: currentPwd,
        newPassword:     newPwd,
      });
      Alert.alert("Success", "Password changed. Please log in again.");
      setCurrentPwd("");
      setNewPwd("");
      await clearAuth();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error?.message ?? "Failed");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 24 }}
      >
        {/* Header */}
        <View style={{ paddingBottom: 16, borderBottomColor: C.border, borderBottomWidth: 1 }}>
          <Text style={{
            color:         C.amber,
            fontSize:      11,
            fontWeight:    "700",
            letterSpacing: 3,
          }}>
            PROFILE
          </Text>
          <Text style={{
            color:      C.text,
            fontSize:   28,
            fontWeight: "900",
            marginTop:  4,
          }}>
            {user?.name}
          </Text>
        </View>

        {/* Account Info */}
        <View>
          <SectionLabel>Account</SectionLabel>
          <Card>
            <StatRow label="Email"        value={user?.email ?? "—"} />
            <StatRow label="Role"         value={user?.role ?? "—"} />
            <StatRow label="Organisation" value={user?.tenantName ?? "—"} />
          </Card>
        </View>

        {/* Change Password */}
        <View>
          <SectionLabel>Change Password</SectionLabel>
          <Card>
            <View style={{ gap: 14 }}>
              <Field
                label="Current Password"
                value={currentPwd}
                onChangeText={setCurrentPwd}
                placeholder="••••••••"
                secureTextEntry
              />
              <Field
                label="New Password"
                value={newPwd}
                onChangeText={setNewPwd}
                placeholder="Min 8 characters"
                secureTextEntry
              />
              <Btn
                onPress={handleChangePassword}
                loading={pwdLoading}
                variant="outline"
                full
              >
                CHANGE PASSWORD
              </Btn>
            </View>
          </Card>
        </View>

        {/* App Info */}
        <View>
          <SectionLabel>App</SectionLabel>
          <Card>
            <StatRow label="Version"     value="1.0.0" />
            <StatRow label="API"         value={process.env.EXPO_PUBLIC_API_URL ?? "localhost"} />
            <StatRow label="Environment" value={__DEV__ ? "DEVELOPMENT" : "PRODUCTION"} />
          </Card>
        </View>

        {/* Logout */}
        <Btn onPress={handleLogout} variant="danger" full>
          SIGN OUT
        </Btn>
      </ScrollView>
    </SafeAreaView>
  );
}