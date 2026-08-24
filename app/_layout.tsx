import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { REMINDER_DONE_ACTION, LumenReminderProvider } from "@/lib/lumen-reminders";
import { EssWorkspaceProvider } from "@/lib/ess-workspace";
import { useLumen, LumenWorkspaceProvider } from "@/lib/lumen-workspace";

function NotificationObserver() {
  const router = useRouter();
  const { setActiveDate, toggleTask } = useLumen();
  useEffect(() => {
    if (Platform.OS === "web") return;
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      const taskId = typeof data.taskId === "string" ? data.taskId : undefined;
      const dueDate = typeof data.dueDate === "string" ? data.dueDate : undefined;
      if (response.actionIdentifier === REMINDER_DONE_ACTION && taskId) toggleTask(taskId);
      if (dueDate) setActiveDate(dueDate);
      router.push("/(tabs)");
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    void Notifications.getLastNotificationResponseAsync().then((response) => { if (response) handleResponse(response); });
    return () => subscription.remove();
  }, [router, setActiveDate, toggleTask]);
  return null;
}

export default function RootLayout() {
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><LumenWorkspaceProvider><EssWorkspaceProvider><LumenReminderProvider><NotificationObserver /><Stack screenOptions={{ headerShown: false, animation: "fade" }}><Stack.Screen name="(tabs)" /><Stack.Screen name="ess/onboarding" /><Stack.Screen name="ess/login" /><Stack.Screen name="attendance" /><Stack.Screen name="work-project/[id]" /><Stack.Screen name="leave" /><Stack.Screen name="payslips" /><Stack.Screen name="analytics" /><Stack.Screen name="activity" /><Stack.Screen name="personal-calendar" /><Stack.Screen name="profile" /><Stack.Screen name="project/[id]" /></Stack></LumenReminderProvider></EssWorkspaceProvider></LumenWorkspaceProvider></SafeAreaProvider></GestureHandlerRootView>;
}
