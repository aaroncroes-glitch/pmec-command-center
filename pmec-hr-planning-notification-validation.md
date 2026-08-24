# PMEC HR Planning and Notification Settings Validation

The desktop Control Center was opened in Project Manager mode, then switched to **Human Resources**. The HR sidebar correctly showed People, Hours & Attendance, HR & Leave, and the new **Leave & Capacity** planning destination; project-delivery navigation remained absent. The HR role descriptor now explicitly includes leave, capacity, and workforce-hours oversight.

The Leave & Capacity dashboard rendered its leave-demand coverage window, leave-decision, approved-leave, and open-capacity metrics, discipline allocation bars, staffing watchlist, and HR recommendation. The employee Notification Settings screen also rendered with both default-on delivery preference toggles and an archived-update section.

The assignment preference was toggled off and verified in the shared `pmec_notification_preferences` record for `employee-76` (`assignments_enabled = 0`). It was then toggled back on, preserving the demo's default delivery behavior.

After a temporary preview reload, the employee notification inbox rendered correctly with one unread approved-hours update and one read assignment update. Both updates exposed an Archive control, and the inbox retained its Settings and Refresh actions.

The first archive attempt coincided with a managed development-service restart and surfaced a transient `Failed to fetch` message. The API server was subsequently confirmed listening again; the archive flow was retried only after the preview recovered.

The retry archived the approved-hours update: it left the active inbox, changed its unread count to zero, and the shared record for `pmec-notify-1787602106003` now has a populated `archived_at` timestamp. The post-mutation refresh still displayed a transient warning, so restoration was verified separately after the services stabilized.

During the subsequent settings navigation, the managed preview briefly reported itself unavailable while its watcher restarted. This did not affect the persisted archive state; restoration verification continued after the development services returned.

Once the preview recovered, Notification Settings displayed the archived approved-hours update with a Restore action. Selecting Restore removed it from the archive immediately, returning the employee archive to its empty state.

The final shared-storage check confirmed the restored time-approved notification has `archived_at = NULL`, while both employee preferences are enabled (`assignments_enabled = 1`, `time_approved_enabled = 1`). This returns the demo to its prior active-notification state after exercising the archive workflow.
