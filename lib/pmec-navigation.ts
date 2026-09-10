// Type-only import: this module stays free of runtime dependencies so it can be tested
// without loading expo-router.
import type { Href } from "expo-router";

/** The part of the expo-router router that back navigation needs. */
export type BackRouter = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: Href) => void;
};

/**
 * Goes back when there is somewhere to go back to, and to `fallback` when there is not.
 *
 * A bare `router.back()` silently does nothing when the navigation history is empty,
 * which is exactly the state after a refresh, after opening a direct link, or after
 * arriving through a replace. Every back control in the app routes through here so
 * none of them can dead-end.
 */
export function performSafeBack(router: BackRouter, fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
