import { useMemo } from "react";

import type { LumenPalette } from "@/lib/lumen-theme";
import { useLumen } from "@/lib/lumen-workspace";

/**
 * Builds a style sheet from the active palette and rebuilds it only when the palette
 * changes. For screens whose styles used to be fixed at module load, which is why they
 * stayed cream when the rest of the app switched theme.
 */
export function useThemedStyles<T>(make: (palette: LumenPalette) => T): T {
  const { palette } = useLumen();
  return useMemo(() => make(palette), [make, palette]);
}
