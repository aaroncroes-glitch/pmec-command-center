/**
 * The PMEC primitive layer.
 *
 * Screens import from here rather than defining private styles. The audit found 1,196
 * style declarations across 888 distinct keys with zero shared components, which is why
 * nothing in the product was learnable: mastering one screen taught you nothing about
 * the next.
 *
 * Rule of thumb: if a screen needs a new style key, a primitive is missing. Add it here.
 */

export { PmecPressable, PmecPressableRow, type PmecPressableProps } from "./pressable";
export { BackButton, useSafeBack, type BackButtonProps } from "./back-button";
export { Body, Eyebrow, Heading, Meta, Title } from "./text";
export { Badge, Button, Card, Chip, type ButtonVariant } from "./controls";
export { StatTile, type Figure, type Money } from "./stat-tile";
export {
  MIN_TARGET,
  radius,
  space,
  status,
  statusBackground,
  statusColor,
  tracking,
  type,
  weight,
  type StatusTone,
} from "@/lib/pmec-design";
