import { validateDeepLink } from "@/lib/deepLink";

describe("deepLink", () => {
  describe("validateDeepLink", () => {
    it("validates allowed scheme", () => {
      const result = validateDeepLink("debtcollectapp://callback");
      expect(result.valid).toBe(true);
    });

    it("validates https scheme", () => {
      const result = validateDeepLink("https://doognpanlarlvnwkbwdz.supabase.co/auth/v1/verify");
      expect(result.valid).toBe(true);
    });

    it("rejects unknown scheme", () => {
      const result = validateDeepLink("malicious://evil.com");
      expect(result.valid).toBe(false);
    });

    it("rejects unallowed host", () => {
      const result = validateDeepLink("https://evil.com/auth/v1/verify");
      expect(result.valid).toBe(false);
    });

    it("detects recovery type", () => {
      const result = validateDeepLink(
        "https://doognpanlarlvnwkbwdz.supabase.co/auth/v1/verify?type=recovery"
      );
      expect(result.type).toBe("recovery");
    });

    it("detects signup type", () => {
      const result = validateDeepLink(
        "https://doognpanlarlvnwkbwdz.supabase.co/auth/v1/verify?type=signup"
      );
      expect(result.type).toBe("signup");
    });

    it("extracts query params", () => {
      const result = validateDeepLink(
        "https://doognpanlarlvnwkbwdz.supabase.co/auth/v1/verify?token=abc123&type=recovery"
      );
      expect(result.params.token).toBe("abc123");
      expect(result.params.type).toBe("recovery");
    });

    it("handles malformed URL", () => {
      const result = validateDeepLink("not-a-url");
      expect(result.valid).toBe(false);
    });
  });
});
