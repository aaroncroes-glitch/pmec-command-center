# PMEC HR Planning and Employee Notification Management

## HR planning dashboard

The HR-only **Leave & Capacity** view will turn the existing leave review queue and workforce allocation data into a planning surface. It will show pending leave, approved time away, capacity pressure, and a two-week coverage window. Each day will expose the number of people away and its operating coverage category: clear, watch, or constrained. A staffing watchlist will pair high-allocation people with leave or availability signals, helping HR coordinate decisions with project leadership.

## Capacity forecast and planning controls

The dashboard will add a five-week, workday-based availability calendar beginning on the Monday before the earliest non-rejected leave request. Each forecast day derives its available room from the selected workforce’s daily contracted capacity less their current allocation, then reserves coverage room for approved leave. Pending leave is shown as a risk signal without being removed from confirmed availability. Days are labelled **clear**, **watch**, or **constrained** using remaining room and leave-risk thresholds so that HR can identify the lowest-capacity window at a glance.

Planning controls will scope every forecast, capacity band, and roster item by **department** (the existing PMEC discipline field) and **role**. HR can then order the filtered roster by risk, allocation, available room, or name. These are client-side planning controls over the existing PMEC demo workforce; they do not alter employee allocation, leave records, or delivery assignments.

## Upcoming-month availability summary

The forecast will include a summary card for the first calendar month represented in the current filtered workday forecast. It will total the selected workforce’s **confirmed available room** after current allocation and approved leave, then place that capacity beside the count of overlapping leave requests. Pending requests remain explicitly labelled as a planning reserve, so HR can compare dependable capacity with the demand that still needs a leave decision.

The calendar will now use a selected-month control with previous and next actions. Each selection shows every workday in that calendar month and recalculates the same department/role scope. The summary card will report **approved leave hours**, **pending leave-reserve hours**, and their combined leave-hour impact by comparing the calendar’s base room, confirmed room, and projected room. This keeps exact absence impact in the same capacity unit as the available-room forecast.

## Employee notification control

Employee notifications will keep their shared PMEC delivery routing but gain two preference switches: new work assignments and time-log approvals. Both are enabled by default. A notification can be archived without deleting delivery history; archived updates are hidden from the active inbox, excluded from unread count, and can be restored from Notification Settings. Notification-generation code will consult the employee preference before inserting assignment or time-approved events.

## Boundaries

This increment is **in-app only**. Preference switches control PMEC inbox events; native push permission and delivery channels remain future work. The current employee demo identity continues to identify the saved preference record, consistent with the existing shared delivery workflow.
