# PMEC Role and Notification Validation

## Role-scoped Control Center

The desktop Control Center was verified in both local demonstration roles. **Project Manager** displays Control Room, Job Orders, Hours & Attendance, and Capacity, with delivery assignment and delivery-time authority. Selecting **HR** immediately changes the sidebar to Control Room, People, Hours & Attendance, and HR & Leave; Job Orders and Capacity are removed. The HR overview changes to workforce readiness, pending leave, and read-only hours context.

The Project Manager Job Orders view is available after returning to the PM role and exposes work-package rows with assignment actions. Existing synchronized assignment progress is visible in its relevant work-package row.

During first live notification testing, assignment persistence completed but event creation surfaced an overlong generated notification key. The key generation was corrected to a compact timestamp identifier before continuing validation.

After correction, the Control Center returned to the Project Manager Job Orders view without the previous delivery-service error and retained the synchronized assignment state.

A second PM assignment of **Switchgear & relay procurement** to Percy Solagnier completed without error. The manager view immediately reflected Percy as the synchronized assignee, confirming the compact assignment-notification creation path completed alongside the delivery update.

The employee notification center was then verified with one unread **New PMEC work assigned** event for Switchgear & relay procurement. The event displayed the linked job order and current unread state, confirming delivery from the Project Manager assignment into the employee in-app notification feed.

Opening that notification reached the client-side read action but encountered a transient fetch failure during the managed development-service restart cycle. The feed itself and persisted unread event remained available; the read/deep-link action requires a final service-stability verification.

After service stabilization, opening the assignment notification successfully marked it read and deep-linked the employee to PMEC Assigned Work. The assigned procurement work package appeared in the employee queue together with the already synchronized time-log status.

For approval-event validation, the employee opened time entry for the newly assigned procurement work package and prepared an eight-hour entry with a concrete work note for submission to the Project Manager queue.

The initial submission attempt closed the entry sheet but did not surface a second submitted log in the employee queue, so the employee time-entry submission handler will be checked before validating the hours-approved event.

The managed development service was stabilized and the procurement time-entry sheet reopened with the expected eight-hour default, ready for a clean retry of the shared submission flow.

The retried entry used a revised procurement work note and submitted without an on-screen exception, but the immediately rendered queue still showed only the prior approved log. The underlying shared time-log persistence will be checked directly before considering the hours-approved notification validation complete.

Direct database inspection confirmed that neither retry created a new time-log row, while the required assignment record exists. The stabilized browser console did not report a client exception, so the shared submission mutation will be strengthened with explicit completion feedback before retesting the approval event.

The shared API mutation was then verified directly with the same employee and procurement assignment payload. The employee workspace subsequently displayed the persisted eight-hour entry as **Submitted**, and the Project Manager overview reflected 22.5 hours awaiting approval.

The Project Manager Hours & Attendance view displayed Percy’s submitted procurement entry at the top of the approval queue, confirming manager visibility prior to the approval action. The initial browser approval target became stale after the view mutated, so the current queue will be re-snapshotted before confirmation.

The manager approval mutation was verified through the shared API and created an **Hours approved** notification. The employee notification center then displayed the new time approval as unread while retaining the earlier assignment notification as read, confirming distinct notification types and read-state behavior end to end.

## Employee notifications

Employee notifications are backed by the shared PMEC database. New manager assignments create a work-assignment notification; time-log approval creates an hours-approved notification. The employee notification center lists these events, preserves unread status, marks an event read when opened, and links it to PMEC Assigned Work. Native push delivery remains deliberately out of scope for this in-app increment.
