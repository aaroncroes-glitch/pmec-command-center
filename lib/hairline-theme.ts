import type { CSSProperties } from "react";

import type { LumenPalette } from "@/lib/lumen-theme";

/** Map PMEC palette tokens to Hairline CSS custom properties. */
export function hairlineThemeVars(palette: LumenPalette, plate: string): CSSProperties {
  return {
    ["--hairline-plate" as string]: plate,
    ["--hairline-hi" as string]: palette.inverseText,
    ["--hairline-edge" as string]: palette.muted,
    ["--hairline-mid" as string]: palette.border,
    ["--hairline-lo" as string]: palette.surface,
    ["--hairline-stroke" as string]: "0.9",
  };
}
