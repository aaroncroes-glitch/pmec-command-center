# PMEC Desktop UI/UX Design Demos

These two routes are **isolated visual prototypes** for desktop and iPad landscape review. They use self-contained presentation data and are not imported by the live PM or HR Control Center, host-routing logic, delivery API, payroll module, or authentication flow. They can be hidden or removed by unregistering their two routes and deleting their standalone screen files.

## Project Manager UI/UX Demo

The PM demo uses the heading **“Delivery Pulse.”** and a compact four-part layout: a narrow navigation rail, a single decision-focused header, three portfolio metrics, and one two-column workspace. The left workspace shows the day’s work that needs a decision; the right workspace contains one focused project card with its status rail, budget burn, short milestone strip, and accountable work packages. The design removes duplicate filters, repeated status labels, and parallel detail panels from the first viewport.

| Design decision | Demonstration behavior |
|---|---|
| One primary task | A manager opens a flagged project from the attention list. |
| Fewer metrics | The header retains only projects on track, projects requiring attention, and forecast variance. |
| One project focus | Selecting a project updates the focus card rather than opening another dashboard layer. |
| Visible prototype boundary | A persistent `UI/UX DEMO — NOT LIVE` label confirms no production workflow is changed. |

## HR UI/UX Demo

The HR demo uses the heading **“Workforce clarity.”** and a compact people-operations layout: a navigation rail, three workforce metrics, a near-term capacity signal, and a single concise leave-and-staffing queue. The design prioritizes coverage decisions over dense person-by-person tables and avoids payroll information entirely.

| Design decision | Demonstration behavior |
|---|---|
| Coverage first | The capacity strip makes the next seven days’ risk immediately scannable. |
| Compact queue | Pending leave and staffing risks appear in one prioritized list. |
| One people focus | Selecting a person opens a concise profile context card within the page. |
| Protected scope | The demo has no payroll actions, server calls, or live personnel data. |

## Review and promotion boundary

Both demos are intentionally reached only through `/pm-ui-demo` and `/hr-ui-demo`. The routes are not linked from `pm.pmec.group`, `hr.pmec.group`, the showcase role launcher, or the Employee portal. When a direction is approved, the selected interaction and layout patterns can be copied deliberately into the relevant live workspace; no automatic promotion occurs.
