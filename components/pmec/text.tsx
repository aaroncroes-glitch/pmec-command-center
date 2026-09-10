import { useMemo } from "react";
import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";

import { useLumen } from "@/lib/lumen-workspace";
import { tracking, type, weight } from "@/lib/pmec-design";

type Palette = ReturnType<typeof useLumen>["palette"];

type BaseProps = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

/**
 * The uppercase letterspaced label that carries most of the interface's character.
 *
 * Two things changed from the previous ad-hoc version, both required and neither a
 * restyle: it bottoms out at 12px (was as low as 7px), and it is set in ink rather than
 * signal orange. The accent measures 2.82:1 on the paper ground and cannot carry text at
 * AA; it keeps doing rules, marks and active states instead.
 *
 * Pass `tone="accent"` only where the label is a decorative mark rather than something
 * the reader must be able to read.
 */
export function Eyebrow({
  children,
  style,
  tone = "muted",
  numberOfLines,
}: BaseProps & { tone?: "ink" | "muted" | "accent" }) {
  const { palette } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  return (
    <Text numberOfLines={numberOfLines} style={[styles.eyebrow, styles[tone], style]}>
      {children}
    </Text>
  );
}

/** Section and card heading. */
export function Heading({ children, style, numberOfLines }: BaseProps) {
  const { palette } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  return (
    <Text numberOfLines={numberOfLines} style={[styles.heading, style]}>
      {children}
    </Text>
  );
}

/** Screen title. */
export function Title({ children, style, numberOfLines }: BaseProps) {
  const { palette } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  return (
    <Text numberOfLines={numberOfLines} style={[styles.title, style]}>
      {children}
    </Text>
  );
}

/** Body copy. `tone="muted"` is the AA-corrected secondary grey. */
export function Body({
  children,
  style,
  tone = "ink",
  numberOfLines,
}: BaseProps & { tone?: "ink" | "muted" }) {
  const { palette } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  return (
    <Text numberOfLines={numberOfLines} style={[styles.body, styles[tone], style]}>
      {children}
    </Text>
  );
}

/** Supporting metadata under a title. Still 13px, still above the readability floor. */
export function Meta({ children, style, numberOfLines }: BaseProps) {
  const { palette } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  return (
    <Text numberOfLines={numberOfLines} style={[styles.meta, style]}>
      {children}
    </Text>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    eyebrow: {
      fontSize: type.label,
      fontWeight: weight.black,
      letterSpacing: tracking.label,
      textTransform: "uppercase",
    },
    ink: { color: palette.foreground },
    muted: { color: palette.muted },
    accent: { color: palette.accent },
    heading: {
      color: palette.foreground,
      fontSize: type.heading,
      fontWeight: weight.bold,
      letterSpacing: tracking.title,
      lineHeight: type.heading * 1.25,
    },
    title: {
      color: palette.foreground,
      fontSize: type.title,
      fontWeight: weight.black,
      letterSpacing: tracking.title,
      lineHeight: type.title * 1.15,
    },
    body: {
      fontSize: type.body,
      fontWeight: weight.regular,
      lineHeight: type.body * 1.5,
    },
    meta: {
      color: palette.muted,
      fontSize: type.meta,
      fontWeight: weight.medium,
      lineHeight: type.meta * 1.45,
    },
  });
