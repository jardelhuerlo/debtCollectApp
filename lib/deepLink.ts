import * as Linking from "expo-linking";

const ALLOWED_SCHEMES = ["debtcollectapp", "https", "http", "exp", "exp+debtcollectapp-v2"];
const ALLOWED_HOSTS = ["doognpanlarlvnwkbwdz.supabase.co"];
const RECOVERY_PATH = "/auth/v1/verify";

export interface DeepLinkResult {
  valid: boolean;
  type: "recovery" | "signup" | "magiclink" | "unknown";
  params: Record<string, string>;
}

export function validateDeepLink(url: string): DeepLinkResult {
  try {
    const parsed = Linking.parse(url);

    if (parsed.scheme && !ALLOWED_SCHEMES.includes(parsed.scheme.toLowerCase())) {
      return { valid: false, type: "unknown", params: {} };
    }

    if (parsed.hostname && !ALLOWED_HOSTS.some((h) => parsed.hostname?.includes(h))) {
      return { valid: false, type: "unknown", params: {} };
    }

    const type = parsed.path?.includes("recovery")
      ? "recovery"
      : parsed.path?.includes("signup")
        ? "signup"
        : parsed.path?.includes("magiclink")
          ? "magiclink"
          : "unknown";

    const params: Record<string, string> = {};
    if (parsed.queryParams) {
      for (const [key, value] of Object.entries(parsed.queryParams)) {
        if (typeof value === "string") {
          params[key] = value.slice(0, 500);
        }
      }
    }

    return { valid: type !== "unknown", type, params };
  } catch {
    return { valid: false, type: "unknown", params: {} };
  }
}

export function getRecoveryUrl(): string {
  return Linking.createURL("/forgotPasswordScreen");
}
