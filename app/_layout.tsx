import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";

import { REMINDER_DONE_ACTION, LumenReminderProvider } from "@/lib/lumen-reminders";
import { EssWorkspaceProvider } from "@/lib/ess-workspace";
import { useLumen, LumenWorkspaceProvider } from "@/lib/lumen-workspace";
import { PmecJobOrderWorkspaceProvider } from "@/lib/pmec-job-order-workspace";
import { PmecControlWorkspaceProvider } from "@/lib/pmec-control-workspace";
import { PmecDeliverySyncProvider } from "@/lib/pmec-delivery-sync";
import { PmecAccessProvider } from "@/lib/pmec-access";
import { ClerkTrpcProvider, TrpcProvider } from "@/lib/trpc-provider";
import { hasUsableClerkPublishableKey } from "@/lib/pmec-clerk-config";

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
  const app = <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><LumenWorkspaceProvider><EssWorkspaceProvider><PmecAccessProvider><PmecDeliverySyncProvider><PmecJobOrderWorkspaceProvider><PmecControlWorkspaceProvider><LumenReminderProvider><NotificationObserver /><Stack screenOptions={{ headerShown: false, animation: "fade" }}><Stack.Screen name="(tabs)" /><Stack.Screen name="admin" /><Stack.Screen name="demo" /><Stack.Screen name="mobile-onboarding" /><Stack.Screen name="control-center" /><Stack.Screen name="job-orders" /><Stack.Screen name="assigned-work" /><Stack.Screen name="notifications" /><Stack.Screen name="ess/onboarding" /><Stack.Screen name="ess/login" /><Stack.Screen name="ess/demo-ticket" /><Stack.Screen name="attendance" /><Stack.Screen name="work-project/[id]" /><Stack.Screen name="leave" /><Stack.Screen name="payslips" /><Stack.Screen name="analytics" /><Stack.Screen name="activity" /><Stack.Screen name="personal-calendar" /><Stack.Screen name="profile" /></Stack></LumenReminderProvider></PmecControlWorkspaceProvider></PmecJobOrderWorkspaceProvider></PmecDeliverySyncProvider></PmecAccessProvider></EssWorkspaceProvider></LumenWorkspaceProvider></SafeAreaProvider></GestureHandlerRootView>;
  const runtimePublishableKey = Constants.expoConfig?.extra?.clerkPublishableKey;
  const injectedPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const publishableKey = hasUsableClerkPublishableKey(runtimePublishableKey) ? runtimePublishableKey : injectedPublishableKey;
  return hasUsableClerkPublishableKey(publishableKey) ? <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}><ClerkTrpcProvider>{app}</ClerkTrpcProvider></ClerkProvider> : <TrpcProvider>{app}</TrpcProvider>;
}
