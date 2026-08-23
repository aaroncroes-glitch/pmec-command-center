# Lumen Mobile Design Plan

## Product premise

Lumen is a local-first task and project workspace for people who want a calm, editorial daily operating system. The starting reference is translated into a more capable product while retaining its defining qualities: oversized day labels, generous negative space, crisp hairline dividers, minimal color, and a clear task-first hierarchy. Every decision assumes a **9:16 portrait viewport** and comfortable one-handed use, with primary actions located in the lower thumb zone.

## Screen list

| Screen | Primary content and functionality |
| --- | --- |
| **Today** | A prominent current-day title, date and focus count, a project progress rail, task list, and a compact adjacent-day timeline. Users can complete tasks, open task details, select a day, and add a task. |
| **Projects** | A concise project index with status, color, progress, and next-action context. Users can open a project, create one, or inspect paused and completed work. |
| **Project detail** | Project name, project health, a segmented task list, and a chronological activity note. Users can create tasks, complete work, and change project status. |
| **Focus** | A low-distraction list of selected priority tasks with a visual progress indicator. Users can begin a focus session and complete a task. |
| **Task composer** | A native-style sheet for entering a task title, selecting a project, priority, and scheduled day, then saving it. |
| **Settings** | Appearance choice, motion preference, and task data reset guidance. |

## Visual system

The visual language is **editorial utility** rather than card-heavy productivity software. The layout uses a warm paper background, dense black typography, neutral hairlines, and a controlled vermilion accent reserved for completion and primary creation. Typography is deliberately large and strongly weighted for dates, days, and screen titles; supporting metadata remains narrow and quiet.

| Role | Value | Application |
| --- | --- | --- |
| Paper | `#F6F3EE` | Main light background and sheets |
| Ink | `#191919` | Headings, body copy, icons, and primary buttons |
| Clay | `#E7E0D8` | Elevated neutral surfaces and inactive states |
| Hairline | `#D4CDC3` | Section separators and form edges |
| Signal orange | `#FF5A1F` | Completion state, primary action, and selected state |
| Night | `#171717` | Dark-mode canvas |
| Night surface | `#242424` | Dark-mode panels and tab surfaces |
| Dark hairline | `#3B3B3B` | Dark-mode separators |

## Layout rules

The Today screen opens with a 48–52 pt uppercase weekday, date metadata, then a minimal focus summary. Sections are divided by full-width hairlines rather than floating containers. Task rows have a 44 pt minimum interaction height, use a 24 pt checkbox target, and reserve the far edge for the project marker or priority. The floating create action is anchored just above the tab bar on the right, within the thumb zone. Tab items use text labels, an understated line icon, and a high-contrast active state.

## Key user flows

| Flow | Steps |
| --- | --- |
| **Complete a task** | Today → tap task checkbox → crisp success haptic → checkbox fills with signal orange → task title reduces in contrast and list settles. |
| **Create a task** | Today or Project detail → tap lower-right create button → composer sheet rises from bottom → enter title and select context → save → sheet dismisses and task appears in its intended list position. |
| **Manage a project** | Projects → select project row → Project detail → create or complete tasks → project progress updates. |
| **Plan the week** | Today → select a nearby day in the timeline → view that day’s tasks → add or complete a task → return to Today. |
| **Enter focus mode** | Focus tab → select an available priority task → start focus → clean full-screen task treatment → finish or exit. |

## Motion and feedback plan

Motion communicates state change and hierarchy; it is never ornamental. Task completion uses a restrained 180–240 ms scale-and-fade treatment alongside haptic success feedback. The composer uses a 260–320 ms spring with high damping so it feels physical without being bouncy. Day selection, tab changes, and task-list updates use opacity and transform transitions only; layout animation is avoided on long lists. Motion respects the device reduced-motion preference by showing instantaneous state changes with the same haptic and visual affordances.

| Interaction | Motion specification | Feedback |
| --- | --- | --- |
| Task completion | Checkbox scales 0.94 → 1 and fills; title fades to 56% opacity | Success haptic |
| Primary button | Press scales to 0.97 for 80 ms | Light impact haptic |
| Composer sheet | Translate from lower edge with a high-damping spring | Light impact haptic on open |
| Screen content | Staggered fade/translate reveal on first visit only | None |
| Day switch | 160 ms crossfade with 6 px lateral offset | None |

## Accessibility and quality guardrails

The app preserves high text contrast in both themes, gives every icon-only action a descriptive label, supports 44 pt touch targets, and avoids placing semantic meaning in color alone. Large text can expand without truncating primary titles. The application maintains local persistence using device storage, and the initial product intentionally excludes sign-in and cloud sync until the user requests those capabilities.
