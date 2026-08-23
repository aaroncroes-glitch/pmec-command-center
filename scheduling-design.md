# Lumen Scheduling and Reminder Extension

## Product behavior

The upgrade preserves Lumen’s local-first model while making the daily workspace more deliberate. The Calendar is a month-at-a-glance planning surface: selecting a day sets the workspace date and reveals that day’s tasks. A task may recur **daily**, **weekly**, or **monthly**. Completing a recurring task creates the next occurrence immediately, keeping the visible list clean without generating an infinite archive.

| Feature | Behavior |
| --- | --- |
| **Calendar** | Month grid with task-count dots, selected-date state, and direct day selection. The selected date synchronizes with Today. |
| **Recurrence** | None, daily, weekly, or monthly. The next task keeps the same title, project, tags, priority, and reminder choice. |
| **Tags** | User-entered, normalized labels. Tags are displayed as compact chips and selectable filters. |
| **Priority filters** | All, high, medium, low. Filters are reversible and compose with tags. |
| **Reminder** | An on-device local notification scheduled for a chosen upcoming time. Recurring tasks schedule the next occurrence’s reminder after completion. |

## Data model additions

| Field | Stored on | Meaning |
| --- | --- | --- |
| `tags` | Task | Normalized list of custom labels, such as `client` or `deep-work`. |
| `recurrence` | Task | Frequency: none, daily, weekly, or monthly. |
| `reminderAt` | Task | Optional local ISO timestamp for the next reminder. |
| `notificationId` | Task | Identifier returned by the device notification scheduler, allowing cancellation when a task changes or completes. |
| `activeTag` and `activePriority` | Workspace | Persistent current filters for task lists and the calendar’s selected-day list. |

## Reminder interaction

The notification category offers a **Mark done** action alongside the default **View task** action. When Lumen is open, an action marks the local task complete; when the notification is tapped, Lumen opens the relevant task date. Local notifications are meaningful only on physical devices where permissions have been accepted. The implementation is deliberately local; sending reminders from a remote server would require user accounts, device-token storage, and a server-side notification workflow.
