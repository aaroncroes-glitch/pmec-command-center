# PMEC HR Planning and Employee Notification Management

## HR planning dashboard

The HR-only **Leave & Capacity** view will turn the existing leave review queue and workforce allocation data into a planning surface. It will show pending leave, approved time away, capacity pressure, and a two-week coverage window. Each day will expose the number of people away and its operating coverage category: clear, watch, or constrained. A staffing watchlist will pair high-allocation people with leave or availability signals, helping HR coordinate decisions with project leadership.

## Employee notification control

Employee notifications will keep their shared PMEC delivery routing but gain two preference switches: new work assignments and time-log approvals. Both are enabled by default. A notification can be archived without deleting delivery history; archived updates are hidden from the active inbox, excluded from unread count, and can be restored from Notification Settings. Notification-generation code will consult the employee preference before inserting assignment or time-approved events.

## Boundaries

This increment is **in-app only**. Preference switches control PMEC inbox events; native push permission and delivery channels remain future work. The current employee demo identity continues to identify the saved preference record, consistent with the existing shared delivery workflow.
