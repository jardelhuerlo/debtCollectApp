import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/services/auth.service";
import { logger } from "@/lib/logger";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (error) {
    logger.error("Failed to get push token", error);
    return null;
  }
}

async function savePushToken(token: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await supabase.from("profiles").update({ push_token: token }).eq("id", user.id);

  if (error) logger.error("Failed to save push token", error);
}

export function usePushNotifications() {
  useEffect(() => {
    registerForPushNotifications().then((token) => {
      if (token) savePushToken(token);
    });
  }, []);
}
