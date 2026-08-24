# PMEC Job Order Demonstration Validation

## Desktop portfolio check

The `/job-orders` route rendered the PMEC project-manager demonstration at desktop width. The overview showed three seeded job orders covering Aruba/AWG/Electrical/Execution, Egypt/EGP/Process-Instrumentation/Design, and Panama/USD/Civil-Structural/QA Inspection. Portfolio budget and spend values were visibly grouped by currency rather than blended.

## Detail-drawer check

The Aruba electrical job order opened in a right-side detail drawer. The drawer displayed its lifecycle, project manager, subcontractor, budget, derived spend, contingency, remaining authorized amount, implied labor multiplier, interactive milestones, grouped WBS work packages, task status/progress, and the local cost-document record.

## Inline work-package check

The in-progress switchgear procurement work package opened inline, exposed its status choices, 5-step progress field, notes, material-line costs, and save/cancel controls. Updating progress from 60% to 65% and saving kept the job-order drawer open, updated the WBS task value, and recalculated the parent job-order progress from 40% to 41%.

## Job-order creation check

The New Job Order right-side panel opened successfully. It exposes the required title, client, ISO currency, budget, start date, and target-end-date fields, as well as project-manager, discipline, and priority controls. The local demonstration explains that newly created records begin at planning with no work packages or derived spend and that currency is locked after creation.

Submitting a representative airport fire-systems job order added it to the top of the Active portfolio with phase **Planning**, zero work packages, zero derived spend, and the chosen USD currency. The grouped portfolio totals updated without blending USD, AWG, and EGP amounts.

The browser-local PMEC job-order workspace was then cleared and remounted. The final local validation view returned to the intended three-record PMEC seed portfolio with its original task-progress values.

## Standalone preview

The PMEC project-manager demonstration was exported and verified at the standalone Vercel preview route:

`https://pmec-job-order-demo-preview-dgftwjs3c-aaron-croes-projects.vercel.app/job-orders`

The deployed page loaded the three seeded job-order cards, grouped AWG/EGP/USD KPIs, PMEC project-delivery framing, portfolio filters, and the New Job Order control without a route fallback error.
