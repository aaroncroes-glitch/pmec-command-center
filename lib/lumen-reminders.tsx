import { type PropsWithChildren, useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { useLumen } from "@/lib/lumen-workspace";

const REMINDER_CHANNEL = "lumen-reminders";
const REMINDER_CATEGORY = "lumen-task-reminder";
export const REMINDER_DONE_ACTION = "lumen-mark-done";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

async function configureReminders() {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, { name: "Upcoming tasks", importance: Notifications.AndroidImportance.DEFAULT, lightColor: "#FF5A1F" });
  }
  await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY, [{ identifier: REMINDER_DONE_ACTION, buttonTitle: "Mark done", options: { opensAppToForeground: true } }]);
  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.status === "granted" ? existing : await Notifications.requestPermissionsAsync();
  return permission.status === "granted";
}

export function LumenReminderProvider({ children }: PropsWithChildren) {
  const { ready, setTaskNotificationId, tasks } = useLumen();
  useEffect(() => {
    if (!ready || Platform.OS === "web") return;
    let active = true;
    const sync = async () => {
      const futureTasks = tasks.filter((task) => !task.completed && task.reminderAt && new Date(task.reminderAt).getTime() > Date.now());
      const needsScheduling = futureTasks.filter((task) => !task.notificationId);
      const needsCancellation = tasks.filter((task) => task.completed && task.notificationId);
      for (const task of needsCancellation) {
        await Notifications.cancelScheduledNotificationAsync(task.notificationId!);
        if (active) setTaskNotificationId(task.id, undefined);
      }
      if (!needsScheduling.length) return;
      const permitted = await configureReminders();
      if (!permitted) return;
      for (const task of needsScheduling) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: { title: "Lumen · upcoming task", body: task.title, categoryIdentifier: REMINDER_CATEGORY, data: { taskId: task.id, dueDate: task.dueDate } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(task.reminderAt!), channelId: REMINDER_CHANNEL },
        });
        if (active) setTaskNotificationId(task.id, notificationId);
      }
    };
    void sync();
    return () => { active = false; };
  }, [ready, setTaskNotificationId, tasks]);
  return children;
}
