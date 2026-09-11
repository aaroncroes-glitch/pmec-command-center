import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { lumenPalettes } from "../lib/lumen-theme";
import {
  MIN_TARGET,
  status,
  statusBackground,
  statusColor,
  type,
} from "../lib/pmec-design";

/* ---------------------------------------------------------------- contrast */

function relativeLuminance(hex: string) {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(value.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrastRatio(a: string, b: string) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const AA_NORMAL = 4.5;

describe("PMEC design tokens — WCAG 2.1 AA", () => {
  // PRODUCT.md sets AA as a hard requirement, not a target. These assertions are the
  // enforcement: a token change that regresses contrast fails the suite rather than
  // shipping and being found by a user in bright sunlight.
  const surfaceNames = ["background", "surface", "surfaceStrong"] as const;

  it("secondary text clears AA on every surface it is used on", () => {
    for (const mode of ["light", "dark"] as const) {
      const palette = lumenPalettes[mode];
      for (const surface of surfaceNames) {
        const ratio = contrastRatio(palette.muted, palette[surface]);
        expect(
          ratio,
          `${mode} muted ${palette.muted} on ${surface} ${palette[surface]}`,
        ).toBeGreaterThanOrEqual(AA_NORMAL);
      }
    }
  });

  it("primary text clears AA on every surface", () => {
    for (const mode of ["light", "dark"] as const) {
      const palette = lumenPalettes[mode];
      for (const surface of surfaceNames) {
        expect(contrastRatio(palette.foreground, palette[surface])).toBeGreaterThanOrEqual(
          AA_NORMAL,
        );
      }
    }
  });

  it("every status tone clears AA on all surfaces and on its own wash", () => {
    for (const mode of ["light", "dark"] as const) {
      const palette = lumenPalettes[mode];
      for (const tone of Object.keys(status) as (keyof typeof status)[]) {
        const fg = statusColor(tone, mode);
        for (const surface of surfaceNames) {
          expect(
            contrastRatio(fg, palette[surface]),
            `${mode} ${tone} on ${surface}`,
          ).toBeGreaterThanOrEqual(AA_NORMAL);
        }
        expect(
          contrastRatio(fg, statusBackground(tone, mode)),
          `${mode} ${tone} on own wash`,
        ).toBeGreaterThanOrEqual(AA_NORMAL);
      }
    }
  });

  it("the signal accent is not used for small text", () => {
    // The accent measures 2.82:1 on paper. It is preserved exactly as a brand colour and
    // is allowed on rules, marks and active states, but it must never carry label text.
    // Eyebrow's default tone is therefore muted, not accent.
    const text = readFileSync(resolve(process.cwd(), "components/pmec/text.tsx"), "utf8");
    expect(text).toContain('tone = "muted"');
    expect(contrastRatio(lumenPalettes.light.accent, lumenPalettes.light.background)).toBeLessThan(
      AA_NORMAL,
    );
  });

  it("label text on an accent fill clears AA", () => {
    // Paper on the accent is the same 2.82:1 pair turned around, so the primary button
    // carries its label in ink, which is how PRODUCT.md resolves the accent.
    for (const mode of ["light", "dark"] as const) {
      const palette = lumenPalettes[mode];
      expect(
        contrastRatio(palette.onAccent, palette.accent),
        `${mode} onAccent ${palette.onAccent} on accent ${palette.accent}`,
      ).toBeGreaterThanOrEqual(AA_NORMAL);
    }
    const controls = readFileSync(resolve(process.cwd(), "components/pmec/controls.tsx"), "utf8");
    expect(controls).toContain("primaryLabel: { color: palette.onAccent }");
  });
});

/* ------------------------------------------------------------------ sizing */

describe("PMEC design tokens — sizing floors", () => {
  it("keeps the interactive target at the AA minimum", () => {
    expect(MIN_TARGET).toBe(44);
  });

  it("keeps every type step above the readability floor", () => {
    // The previous interface set 267 of 527 sizes below 11px, including 72 at 8px and
    // 5 at 7px. Nothing in the scale may go back below 12.
    for (const [name, size] of Object.entries(type)) {
      expect(size, `type.${name}`).toBeGreaterThanOrEqual(12);
    }
  });

  it("keeps a real step between adjacent type sizes", () => {
    const sizes = Object.values(type).sort((a, b) => a - b);
    for (let i = 1; i < sizes.length; i += 1) {
      expect(sizes[i]! - sizes[i - 1]!).toBeGreaterThan(0);
    }
  });
});

/* ------------------------------------------------------- accessibility API */

describe("PMEC primitives — accessibility by construction", () => {
  const pressable = readFileSync(
    resolve(process.cwd(), "components/pmec/pressable.tsx"),
    "utf8",
  );

  it("requires an accessible name rather than accepting an optional one", () => {
    // React Native Web renders Pressable as a bare div. An optional label is how the
    // previous code ended up with 196 handlers and only 35 labels.
    expect(pressable).toContain("accessibilityLabel: string;");
    expect(pressable).not.toContain("accessibilityLabel?: string;");
  });

  it("always sets a role, a state, and a minimum target", () => {
    expect(pressable).toContain("accessibilityRole: role,");
    expect(pressable).toContain("accessibilityState: { disabled, selected },");
    expect(pressable).toContain("minHeight: MIN_TARGET");
    expect(pressable).toContain("minWidth: MIN_TARGET");
  });

  it("renders a visible keyboard focus ring", () => {
    expect(pressable).toContain("onFocus");
    expect(pressable).toContain("focused && styles.focused");
    expect(pressable).toContain("outlineWidth: FOCUS_RING");
  });

  it("expands dense targets outward instead of dropping below the minimum", () => {
    // React Native Web does not implement hitSlop, so the target must be grown with real
    // box padding and pulled back with a negative margin. A regression to hitSlop here
    // would silently reintroduce sub-44px targets on the web build.
    expect(pressable).toContain("(MIN_TARGET - denseHeight) / 2");
    expect(pressable).toContain("paddingVertical: inset");
    expect(pressable).toContain("marginVertical: -inset");
    // used as a prop, not merely named in a comment explaining why it is avoided
    expect(pressable).not.toMatch(/hitSlop[=:]/);
  });

  it("announces toggle state, which RN Web omits for role=button", () => {
    expect(pressable).toContain('"aria-pressed": pressedState');
  });
});

/* ------------------------------------------------------------ money figures */

describe("StatTile money handling", () => {
  const tile = readFileSync(resolve(process.cwd(), "components/pmec/stat-tile.tsx"), "utf8");

  it("models multi-currency as a list, so it cannot be concatenated and clipped", () => {
    expect(tile).toContain('kind: "money"; values: Money[]');
  });

  it("never truncates a currency figure to a single clipped line", () => {
    expect(tile).toContain("numberOfLines={2}");
    expect(tile).toContain("styles.moneyStack");
  });
});
