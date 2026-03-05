import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth.store";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const user = useAuthStore((s) => s.user);
  const tokenSentRef = useRef(false);

  useEffect(() => {
    if (!user || tokenSentRef.current) return;

    registerPushToken().then(() => {
      tokenSentRef.current = true;
    });
  }, [user?.id]);

  const registerPushToken = async () => {
    if (!Device.isDevice) {
      console.log("[Push] Not a real device; skipping");
      return;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[Push] Permission denied");
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    const platform = Platform.OS as "ios" | "android";

    try {
      await api.post("/notifications/push-token", {
        token: tokenData.data,
        platform,
      });
      console.log("[Push] Token registered:", tokenData.data);
    } catch (err) {
      console.error("[Push] Failed to register token:", err);
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Fleet AI",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#f59e0b",
      });
    }
  };
}
