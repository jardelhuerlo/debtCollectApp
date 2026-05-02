import { checkRateLimit, resetRateLimit, getRemainingAttempts } from "@/lib/rateLimiter";

describe("rateLimiter", () => {
  const testIdentifier = "test@example.com";

  beforeEach(() => {
    resetRateLimit(testIdentifier);
  });

  it("allows first attempt", () => {
    const result = checkRateLimit(testIdentifier);
    expect(result.allowed).toBe(true);
  });

  it("allows up to MAX_ATTEMPTS", () => {
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(testIdentifier);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks after MAX_ATTEMPTS", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit(testIdentifier);
    }
    const result = checkRateLimit(testIdentifier);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeDefined();
    expect(result.retryAfter!).toBeGreaterThan(0);
  });

  it("tracks remaining attempts", () => {
    expect(getRemainingAttempts(testIdentifier)).toBe(5);
    checkRateLimit(testIdentifier);
    expect(getRemainingAttempts(testIdentifier)).toBe(4);
    checkRateLimit(testIdentifier);
    expect(getRemainingAttempts(testIdentifier)).toBe(3);
  });

  it("resets after resetRateLimit", () => {
    checkRateLimit(testIdentifier);
    checkRateLimit(testIdentifier);
    resetRateLimit(testIdentifier);
    expect(getRemainingAttempts(testIdentifier)).toBe(5);
  });

  it("tracks attempts per identifier independently", () => {
    checkRateLimit("user1@example.com");
    checkRateLimit("user1@example.com");
    expect(getRemainingAttempts("user1@example.com")).toBe(3);
    expect(getRemainingAttempts("user2@example.com")).toBe(5);
  });
});
