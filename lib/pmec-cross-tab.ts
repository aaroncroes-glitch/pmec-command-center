import { useEffect } from "react";

/**
 * Keeps a browser-stored workspace in step across windows.
 *
 * A showcase runs two windows side by side, the phone-sized employee view and the desktop
 * control center, on one address and one set of stored data. The browser fires `storage`
 * in every other window when one of them writes, so each provider re-reads its own key and
 * a leave request, an assignment or an approval shows up on the other screen straight
 * away, with no server. Outside the web build there is nothing to listen to.
 *
 * `apply` should be stable (wrap it in useCallback), or the listener re-subscribes on
 * every render.
 */
export function useCrossTabStore(key: string, apply: (raw: string) => void) {
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === key && event.newValue) apply(event.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [apply, key]);
}
