export type PmecHostWorkspace = "portal" | "hr" | "pm" | "unknown";

function normaliseHost(hostname: string | undefined) {
  return (hostname ?? "").trim().toLowerCase().replace(/\.$/, "");
}

export function resolvePmecHostWorkspace(hostname?: string): PmecHostWorkspace {
  const host = normaliseHost(hostname);
  if (host === "portal.pmec.group") return "portal";
  if (host === "hr.pmec.group") return "hr";
  if (host === "pm.pmec.group") return "pm";
  return "unknown";
}

export function getPmecHostWorkspace(): PmecHostWorkspace {
  if (typeof window === "undefined") return "unknown";
  return resolvePmecHostWorkspace(window.location.hostname);
}

export function getPmecHostLockedRole(hostname?: string): "pm" | "hr" | null {
  const workspace = resolvePmecHostWorkspace(hostname);
  return workspace === "pm" || workspace === "hr" ? workspace : null;
}

export function getCurrentPmecHostLockedRole(): "pm" | "hr" | null {
  if (typeof window === "undefined") return null;
  return getPmecHostLockedRole(window.location.hostname);
}
