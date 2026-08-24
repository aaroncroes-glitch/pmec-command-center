# PMEC Employee Delivery Synchronization

## Purpose

The employee workspace and the PMEC Control Center will read the same delivery records. A project manager creates or changes an assignment in the Control Center; the employee sees it in the mobile **Assigned work** area. When the employee submits time, the manager sees the same log in **Hours & attendance** for approval.

## Shared data contract

| Record | Manager action | Employee action | Synchronization result |
|---|---|---|---|
| Assignment | Assign a PMEC job-order work package to an employee | View assigned work and update its delivery status | The assignment appears in both workspaces with the current status and assignee. |
| Time log | Review or approve submitted time | Submit hours, date, and work note for an assigned work package | The log appears in the employee history and PM approval queue. |
| Employee identity | Select a seeded PMEC employee when assigning work | Employee ESS demo identity maps to the matching PMEC workforce record | Percy Solagnier is seeded as the employee demo identity; named PMEC workforce records remain available for manager-side planning. |

## Delivery constraints

The demo will use the project database and API so web and mobile clients can see the same records. It will retain the existing local ESS PIN flow rather than introduce full production identity management in this increment. Production rollout should replace seeded identity mapping with authenticated employee accounts and server-side role authorization.

## Preview deployment note

The synchronization workflow requires the managed API server and database. The prior direct Vercel previews are static exports and do not host this project API, so they remain suitable for visual UI review but not for validating cross-device assignments or time-log synchronization. The managed project preview hosts the working shared service during this demonstration phase.
