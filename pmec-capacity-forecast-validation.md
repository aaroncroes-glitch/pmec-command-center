# PMEC Capacity Forecast and Planning Controls Validation

The HR-only **Leave & Capacity** destination rendered the five-week workday forecast for the full 34-person PMEC workforce. It showed a 63-hour lowest projected daily room, workday-only dates from April 13 through May 15, approved and pending leave markers, clear/watch/constrained legend states, discipline capacity bands, a risk-sorted staffing roster, and filtered leave-impact details.

Selecting **Electrical** reduced the planning scope to seven people, recalculated weekly room to 61 hours, and isolated the April 28 pending-leave risk as a 4-hour constrained day. Selecting **Available Room** changed the roster action label to `ROOM FIRST` and ordered the selected department from Noah Croes (3-hour weekly room) through Theo Nichols (15-hour weekly room), while preserving the department-specific forecast.

Selecting the **Electrical Engineer** role narrowed the scope to Sofia Arends and recalculated the April 28 pending-leave impact to negative 7 hours of projected room, correctly marking it constrained. Resetting the role restored the seven-person Electrical forecast and roster.

Automated regression validation completed with TypeScript passing and 25 deterministic tests passing across the forecast, PMEC delivery, job-order, HR/PM demo, ESS, and utility suites.
