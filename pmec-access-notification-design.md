# PMEC Role Access and Employee Notifications

## Demonstration roles

The control center will use a local role switcher for this demonstration. It deliberately scopes the interface and permitted actions without claiming production-grade identity enforcement; production deployment must bind these roles to authenticated server identities and enforce them in the API.

| Capability | Project Manager | HR |
|---|---:|---:|
| Job-order delivery and task assignment | Full | Hidden |
| Capacity and allocation planning | Full | Hidden |
| Delivery-hours approval | Full | Read-only |
| Workforce directory | Hidden | Full |
| Leave review and HR delivery signals | Hidden | Full |
| Role overview | Delivery-focused | Workforce-focused |

## Employee notification events

The shared database will retain in-app notifications per employee. A manager assignment creates a **New work assigned** event, while approval of an employee-submitted time entry creates a **Hours approved** event. Each event includes a destination route so opening it takes the employee to the PMEC Assigned Work inbox. Employees can mark individual notifications read or clear their unread state without deleting the audit record.

The employee notification center is an in-app feed. Native push delivery is intentionally out of scope for this increment; it requires registered device tokens and production push credentials.
