import React, { useState } from "react";
import {
  View, Text, ScrollView, KeyboardAvoidingView,
  Platform, StatusBar, Alert,
} from "react-native";
import { authApi } from "../lib/api";
import { useAuthStore } from "../store/auth.store";
import { Field, Btn, C } from "../components/UI";

export default function LoginScreen() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Enter your email and password");
      return;
    }

    setLoading(true);
    try {
      const res  = await authApi.login({ email, password });
      const data = res.data.data;
      await setAuth(data.user, data.tokens);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? "Login failed";
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{
          flexGrow:        1,
          justifyContent:  "space-between",
          paddingHorizontal: 24,
          paddingTop:       80,
          paddingBottom:    48,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View>
          <View style={{
            width:           48,
            height:          48,
            backgroundColor: C.amber,
            alignItems:      "center",
            justifyContent:  "center",
            marginBottom:    32,
          }}>
            <Text style={{ fontSize: 24, fontWeight: "900", color: "#000" }}>
              F
            </Text>
          </View>

          <Text style={{
            fontSize:      52,
            fontWeight:    "900",
            color:         C.text,
            letterSpacing: -1,
            lineHeight:    52,
            marginBottom:  8,
          }}>
            FLEET{"\n"}
            <Text style={{ color: C.amber }}>AI</Text>
          </Text>

          <Text style={{
            color:     C.muted,
            fontSize:  14,
            marginBottom: 48,
            letterSpacing: 1,
          }}>
            DRIVER CONSOLE
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: 16 }}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          <View style={{ marginTop: 8 }}>
            <Btn
              onPress={handleLogin}
              loading={loading}
              full
              large
            >
              SIGN IN
            </Btn>
          </View>
        </View>

        {/* Footer */}
        <Text style={{
          color:     C.faint,
          fontSize:  12,
          textAlign: "center",
          letterSpacing: 1,
        }}>
          FLEET AI MANAGEMENT PLATFORM
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}