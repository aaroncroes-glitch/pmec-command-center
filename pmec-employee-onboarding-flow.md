# PMEC Lumen: Employee Invitation and Mobile Onboarding Flow

This storyboard shows the intended **employee-only** onboarding journey for the 28 PMEC employees. It is designed for the existing warm-paper Lumen mobile experience and assumes Clerk handles authentication while the PMEC API activates the Neon membership.

> The employee never selects a role. HR creates the invite from the existing workforce record; the API verifies the email and activates the preassigned `employee` membership only after Clerk verifies that person’s identity.

## Journey Overview

| Stage | Trigger | Data shown | Server decision |
|---|---|---|---|
| Invite prepared | HR selects an employee in People | Work email, role `employee`, mobile workspace | Employee must be active and have no other open employee invitation. |
| Invite email | Server calls Clerk’s Organization invitation endpoint | Branded PMEC invitation email | Clerk owns the one-time invitation link. |
| App handoff | Employee opens email on phone | PMEC Lumen welcome screen | Universal link resolves to the sign-in/onboarding route. |
| Verify identity | Employee completes Clerk sign-in or sign-up | Email confirmation and account recovery UI | Clerk verifies the email and returns a signed session. |
| Activate membership | App calls PMEC onboarding completion endpoint | “Setting up your workspace” | API matches Clerk identity, invitation, active person, and `employee` role. |
| Preference setup | Employee confirms notifications | Assignment and approved-hours toggles | API creates notification preferences/onboarding progress. |
| First workspace | Employee reaches Assigned Work | Current tasks, leave balance, time entry | All data is scoped to the server-derived person ID. |

Clerk invitations provide a unique emailed invitation link, and server-created invitations can specify a redirect URL for the application’s acceptance flow.[1]

## Screen 1: Invitation Email

```text
┌──────────────────────────────────────┐
│ PMEC / LUMEN                         │
│                                      │
│ You are invited to your              │
│ employee workspace.                  │
│                                      │
│ View assigned work, log hours,       │
│ request leave, and receive updates.  │
│                                      │
│ [ OPEN PMEC LUMEN  → ]               │
│                                      │
│ Invitation for: name@pmec-group.com  │
│ Expires: [Clerk invitation policy]   │
└──────────────────────────────────────┘
```

The invite must be sent to the work email held in `pmec.people.work_email`. It should not disclose job orders, leave information, or other employee data.

## Screen 2: App Handoff and Welcome

```text
┌──────────────────────────────────────┐
│ PMEC / LUMEN                         │
│                                      │
│ Welcome to your                      │
│ work workspace.                      │
│                                      │
│ Your PMEC invitation is ready.       │
│ Sign in with your invited work email │
│ to set up your employee workspace.   │
│                                      │
│ [ CONTINUE WITH WORK EMAIL  → ]      │
│                                      │
│ Need help? Contact HR                │
└──────────────────────────────────────┘
```

The mobile app receives an invitation token/reference in the deep link, stores only a short-lived onboarding reference, and opens Clerk’s hosted or native-supported authentication. Clerk’s Expo setup uses a `ClerkProvider` and secure `tokenCache`; it should not store database secrets or PMEC roles in the device.[2]

## Screen 3: Identity Verification

```text
┌──────────────────────────────────────┐
│ < BACK                               │
│                                      │
│ Confirm your work email              │
│                                      │
│ name@pmec-group.com                  │
│                                      │
│ A secure verification step will      │
│ confirm you can access PMEC Lumen.   │
│                                      │
│ [ SEND / ENTER CODE ]                │
│                                      │
│ This account is for employee access  │
│ only.                                │
└──────────────────────────────────────┘
```

This screen is Clerk-owned or Clerk-rendered. It handles sign-in, account creation, verification, recovery, and optional MFA according to PMEC’s Clerk configuration. The PMEC app does not implement or store passwords.

## Screen 4: Membership Activation

```text
┌──────────────────────────────────────┐
│ PMEC / LUMEN                         │
│                                      │
│ Setting up your                      │
│ workspace.                           │
│                                      │
│ • Verifying invitation               │
│ • Connecting your employee profile   │
│ • Preparing your task inbox          │
│                                      │
│             [ loading ]              │
└──────────────────────────────────────┘
```

The app sends the Clerk session token and invitation reference to `onboarding.complete`. The server verifies all conditions atomically:

1. The Clerk token is valid and the verified email matches the pending PMEC invitation.
2. The invitation is not revoked, expired, or previously accepted.
3. The employee record is active and belongs to the PMEC organization.
4. The requested role is exactly `employee` and the permitted surface is `employee_mobile`.
5. No different Clerk identity is already attached to the employee person record.

On success, the API writes `auth_identities`, marks `memberships.status = 'active'`, marks the invite accepted, creates `onboarding_progress`, and appends an audit event in a single transaction.

## Screen 5: Employee Preferences

```text
┌──────────────────────────────────────┐
│ ALMOST READY                         │
│                                      │
│ Receive the updates that keep         │
│ your work moving.                    │
│                                      │
│ New task assignments        [ ON ]   │
│ Approved working hours      [ ON ]   │
│ Leave decisions             [ ON ]   │
│                                      │
│ You can change these later in        │
│ Notification Settings.               │
│                                      │
│ [ ENTER MY WORKSPACE  → ]            │
└──────────────────────────────────────┘
```

The preference action creates or updates the user-owned `notification_preferences` record. It remains separate from authorization: disabling a notification never changes the employee’s ability to view a task or leave decision.

## Screen 6: Assigned Work

```text
┌──────────────────────────────────────┐
│ GOOD MORNING, [PREFERRED NAME]       │
│                                      │
│ YOUR ASSIGNED WORK                   │
│ [ Job order / work package card ]    │
│ Status  ·  Due date  ·  Progress     │
│                                      │
│ [ START WORK ]  [ LOG HOURS ]        │
│                                      │
│  ◉ New assignment                    │
│  ◉ Hours approved                    │
│                                      │
│ HOME   WORK   LEAVE   PROFILE         │
└──────────────────────────────────────┘
```

The API must derive the person ID from `auth_identities` for every request. The application should never receive an employee picker or an arbitrary `employeeId` input in an employee procedure.

## Error and Recovery States

| Condition | Employee-facing response | Server behavior |
|---|---|---|
| Invite expired/revoked | “This invitation is no longer active. Ask HR for a new invite.” | No membership is activated; audit failed attempt. |
| Email mismatch | “Please sign in with your invited PMEC work email.” | Reject activation; do not expose the target person name. |
| Employee inactive | “Your PMEC access is not currently active.” | Return 403; log access denial. |
| Already linked to another Clerk identity | “This workspace is already connected. Contact HR.” | Reject mutation and require verified admin resolution. |
| Network interruption | “We’ll finish setting up when you reconnect.” | Preserve short-lived local progress; retry the idempotent completion call. |

## HR/Administrator Operating Flow

1. Open **People** in the Operations Center and select an active employee record.
2. Review the work email and employee designation; no PM/HR role choices appear in this flow.
3. Select **Send mobile workspace invitation**.
4. The API creates the pending Neon invitation, sends the Clerk Organization invitation, and logs the action.
5. HR can see **Sent**, **Accepted**, **Expired**, **Revoked**, or **Blocked** state; only a server-side HR/admin action can resend or revoke.

## Acceptance Checks

- An invited employee can sign in on mobile and reaches only the employee workspace.
- A Project Manager or HR invitation never resolves to the employee mobile onboarding route.
- An employee cannot use a deep link to view desktop role content.
- A valid Clerk account with no active PMEC membership receives a safe access-denied screen.
- A second invocation of `onboarding.complete` is idempotent and returns the active membership rather than creating duplicates.
- Every invite, activation, resend, revoke, and denial is present in `audit_events`.

## References

[1] [Clerk: Organization invitations](https://clerk.com/docs/guides/organizations/add-members/invitations)

[2] [Clerk: Expo Quickstart](https://clerk.com/docs/expo/getting-started/quickstart)
