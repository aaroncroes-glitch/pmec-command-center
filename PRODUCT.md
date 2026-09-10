# Product

## Register

product

## Users

Three roles, weighted equally. The primitives must hold for all three; none is allowed to
become the default the others bend around.

**Field technician — phone, outdoors.** Electrical and site staff (the demo data's
"Electrical Technician", "Site Engineer" are representative) clocking in, logging hours
against a job order, checking assignments and leave. Bright sun, possibly gloves, one hand
free, intermittent signal. Opens the app briefly and often. Least tolerant of small
targets, low contrast, and anything that needs reading twice.

**Project manager — iPad, often mid-site-visit.** Reviews delivery progress, approves
logged time, watches budget variance across multiple currencies and regions, assigns work.
Needs dense information that stays scannable, and numbers they can act on without
double-checking elsewhere.

**HR — desktop.** Leave decisions, workforce capacity planning, org-wide hours visibility,
payroll review. Works in tables and filters. Several of their actions are consequential
and hard to reverse.

## Product Purpose

PMEC Command Center is the internal workspace for PMEC (Project Management and Engineering
Consultancy N.V., Aruba) covering employee self-service, project delivery, and HR. It
replaces scattered manual tracking of assignments, hours, leave, and job-order costs across
PMEC's regions.

It ships on three role-locked hostnames: `portal.` (employee, mobile-first), `pm.` and
`hr.` (desktop/iPad). The host determines the role; the user does not choose it.

**Stage: pitch now, rollout to real staff immediately after.** This has a direct
consequence — nothing may be built to demo well and be replaced later. There is one build,
and it has to survive contact with real employees.

Success is that a technician logs hours without being trained, a project manager trusts the
budget figure in front of them, and HR completes a leave decision without a second system.

## Brand Personality

**Engineering-precise.** Technical, exact, quietly confident. It should read like a
well-kept drawing set: everything measured, nothing decorative, no wasted marks. Closer to
a discipline drawing or a project schedule than to software.

Voice is plain and declarative. It states what is true and what will happen. It does not
reassure, apologize, celebrate, or explain its own architecture.

## Anti-references

**The strongest constraint on this product is preservation.** The existing visual language
is settled and is not up for redesign:

- warm paper ground, ink type, hairline rules instead of floating containers
- condensed heavy display weights, uppercase letterspaced labels
- a single held accent (signal orange), never a second accent colour

Anything that departs from that language is the anti-reference, including well-intentioned
"improvements". Do not introduce new hues, new type families, card-and-shadow layouts, or
softened consumer styling. Legibility and structure may change. The language may not.

Semantic status colour (pass / warning / critical) is the one permitted exception, kept
within the existing warm range so it reads as part of the same family rather than as a
second palette.

## Design Principles

**1. Preserve the language; change only legibility and structure.**
Every fix must be expressible as "same look, now readable" or "same look, now findable".
If a change would be visible as a restyle, it is out of scope.

**2. One build serves the pitch and the rollout.**
No demo-grade shortcuts. If it would be replaced when real users arrive, do not build it.

**3. Primitives carry the design, screens carry the content.**
The visual system lives in shared components, not in per-screen style blocks. A screen that
needs a new style key is a signal that a primitive is missing.

**4. Accessibility is a property of the components, not a later pass.**
Role, label, focus state and minimum hit area are set by construction, so a screen cannot
opt out by omission.

**5. Say it in the user's words, not the system's.**
No vendor names, no permission-model vocabulary, no internal codenames in anything a PMEC
employee reads. One name per concept, everywhere.

## Accessibility & Inclusion

**WCAG 2.1 AA is a hard requirement**, not a target. PMEC's clients include utilities,
hospitals, water authorities and government bodies, where conformance is routinely asked
for.

- Text contrast at least 4.5:1 (3:1 for large text), verified against every surface a
  token is used on, not just the base background.
- Minimum 44×44px interactive target on every device, enforced by the shared pressable.
- Every interactive element exposes a role, an accessible name, and a visible focus state.
- Full keyboard operability, including real links for navigation.
- Status is never carried by colour alone; it is paired with a label or shape.
- Respect reduced-motion preferences.

Field conditions are an accessibility requirement here, not a nice-to-have: bright outdoor
light and gloved hands set the floor for contrast and target size.

### Resolved tension

Signal orange `#FF5A1F` measures 2.82:1 on the paper ground and cannot carry small text at
AA. The accent is **not** being changed. Instead it stops carrying label text and continues
to do rules, marks, active states and brand moments, with ink carrying the words. Muted
grey moves in lightness only, at the same hue, to clear 4.5:1 on all three surfaces. Both
resolutions satisfy AA without altering the design language.
