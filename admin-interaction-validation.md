# Administrative Interaction Validation

## Desktop Browser Checks

The local `/admin` workspace rendered successfully at desktop width. The Leave view displayed three pending seeded requests, allowed all pending requests to be selected with the bulk control, and converted all three to **Approved** through the bulk approval action. The queue count updated from three pending requests to zero.

The Projects view rendered the delivery-progress bar chart and updated the project-focus panel when **Office Fit-out** was selected. The focus panel reflected the selected project name, client, code, completion percentage, open-task count, and phase count.

The Time & allocation view displayed sortable high-allocation workload bars and an allocation-focus panel. The selected-person profile modal opened successfully from the capacity view and displayed the person’s employee status, allocation, current project assignment, and full leave history.

The People directory rendered 34 workforce records and exposed each row as an accessible profile trigger. The directory also retained its All, Employee, and Contractor workforce filters.

The Contractor filter reduced the directory to six contractors. A contractor profile opened successfully and displayed its engagement status, allocation, active assignment mix, and the deliberate distinction that employee leave balances and leave requests do not apply to contractor records.

These checks used local demonstration data only. The browser’s persisted demo state may be cleared during final validation to restore the seeded queue.

The browser-local ESS storage key was cleared after the bulk-approval check so a fresh mounted workspace returns to the seeded review queue.
