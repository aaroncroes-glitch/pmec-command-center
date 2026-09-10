import { useMemo } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { useLumen } from "@/lib/lumen-workspace";
import { space, tracking, type, weight } from "@/lib/pmec-design";
import { Badge } from "@/components/pmec/controls";
import { PmecPressable } from "@/components/pmec/pressable";
import type { StatusTone } from "@/lib/pmec-design";

type Palette = ReturnType<typeof useLumen>["palette"];

export type Money = { currency: string; amount: number };

/**
 * A figure the tile can display.
 *
 * Money is deliberately a list rather than a string. PMEC operates across AWG, EGP and
 * USD, and the previous tile concatenated all three into one line, which then clipped at
 * roughly half its length: "AWG 185,000 · EGP 4,200,000 · USD 310,000" rendered 435px of
 * text into a 247px box, so the project manager could not read either headline figure.
 *
 * Summing across currencies is not a total in any case. Keeping them as separate entries
 * makes the honest presentation the easy one, and the broken one unrepresentable.
 */
export type Figure =
  | { kind: "money"; values: Money[] }
  | { kind: "count"; value: number; unit?: string }
  | { kind: "text"; value: string };

function formatMoney({ currency, amount }: Money) {
  return `${currency} ${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function announce(figure: Figure): string {
  if (figure.kind === "money") return figure.values.map(formatMoney).join(", ");
  if (figure.kind === "count") {
    return figure.unit ? `${figure.value} ${figure.unit}` : String(figure.value);
  }
  return figure.value;
}

/**
 * Summary figure with a label and optional status.
 *
 * Multi-currency money stacks vertically at a readable size rather than truncating.
 * Single-currency and count figures keep the large display treatment.
 */
export function StatTile({
  label,
  figure,
  caption,
  tone,
  toneLabel,
  style,
  onPress,
}: {
  label: string;
  figure: Figure;
  caption?: string;
  /** Optional status badge, e.g. over-budget. Requires `toneLabel`. */
  tone?: StatusTone;
  toneLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Makes the tile a drill-down into the detail behind the figure. */
  onPress?: () => void;
}) {
  const { palette } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const multiCurrency = figure.kind === "money" && figure.values.length > 1;
  const name = `${label}: ${announce(figure)}${caption ? `. ${caption}` : ""}`;

  const content = (
    <>
      <Text style={styles.label}>{label}</Text>
      {renderFigure()}
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      {tone && toneLabel ? <Badge label={toneLabel} tone={tone} style={styles.badge} /> : null}
    </>
  );

  if (onPress) {
    return (
      <PmecPressable
        accessibilityLabel={name}
        hint="Opens the detail behind this figure"
        onPress={onPress}
        style={[styles.tile, style]}
      >
        {content}
      </PmecPressable>
    );
  }

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={name}
      style={[styles.tile, style]}
    >
      {content}
    </View>
  );

  function renderFigure() {
    if (figure.kind === "money") {
      if (!figure.values.length) return <Text style={styles.figure}>—</Text>;
      return (
        <View style={multiCurrency ? styles.moneyStack : undefined}>
          {figure.values.map((value) => (
            <Text
              key={value.currency}
              style={multiCurrency ? styles.moneyRow : styles.figure}
              // Currency figures must never be clipped: they are the number the
              // decision is made on. Allow a wrap instead.
              numberOfLines={2}
            >
              {formatMoney(value)}
            </Text>
          ))}
        </View>
      );
    }
    return (
      <Text style={styles.figure} numberOfLines={1} adjustsFontSizeToFit>
        {figure.kind === "count" ? figure.value.toLocaleString("en-US") : figure.value}
        {figure.kind === "count" && figure.unit ? (
          <Text style={styles.unit}>{` ${figure.unit}`}</Text>
        ) : null}
      </Text>
    );
  }
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    tile: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      flex: 1,
      gap: 6,
      // Stated explicitly so a drill-down tile aligns with the static tiles beside it:
      // PmecPressable centres its content by default, which is right for a button and
      // wrong for a tile sitting in a row of them.
      justifyContent: "flex-start",
      minWidth: 180,
      padding: space.lg,
    },
    label: {
      color: palette.muted,
      fontSize: type.label,
      fontWeight: weight.black,
      letterSpacing: tracking.label,
      textTransform: "uppercase",
    },
    figure: {
      color: palette.foreground,
      fontSize: type.figure,
      fontWeight: weight.black,
      letterSpacing: tracking.display,
      lineHeight: type.figure * 1.1,
    },
    unit: {
      color: palette.muted,
      fontSize: type.bodyStrong,
      fontWeight: weight.bold,
      letterSpacing: 0,
    },
    /** Multi-currency: each currency on its own line, at a size that fits the column. */
    moneyStack: { gap: 2, paddingVertical: 2 },
    moneyRow: {
      color: palette.foreground,
      fontSize: type.bodyStrong,
      fontWeight: weight.bold,
      letterSpacing: -0.2,
      lineHeight: type.bodyStrong * 1.35,
    },
    caption: {
      color: palette.muted,
      fontSize: type.meta,
      fontWeight: weight.medium,
      lineHeight: type.meta * 1.4,
    },
    badge: { marginTop: 2 },
  });
