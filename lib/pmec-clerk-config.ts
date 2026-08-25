function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return typeof globalThis.atob === "function" ? globalThis.atob(normalized) : "";
}

export function hasUsableClerkPublishableKey(value?: string) {
  const match = value?.match(/^pk_(?:test|live)_([A-Za-z0-9_-]+)$/);
  if (!match) return false;

  try {
    const frontendApi = decodeBase64Url(match[1]!);
    return frontendApi.includes("clerk") && frontendApi.includes(".");
  } catch {
    return false;
  }
}
