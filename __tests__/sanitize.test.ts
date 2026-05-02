import { sanitizeString, sanitizeEmail, sanitizeNumber, sanitizeNote } from "@/lib/sanitize";

describe("sanitize", () => {
  describe("sanitizeString", () => {
    it("trims whitespace", () => {
      expect(sanitizeString("  hello  ")).toBe("hello");
    });

    it("removes HTML tags", () => {
      expect(sanitizeString("<script>alert('xss')</script>")).toBe("scriptalert('xss')/script");
    });

    it("limits to 500 characters", () => {
      const long = "a".repeat(600);
      expect(sanitizeString(long).length).toBe(500);
    });
  });

  describe("sanitizeEmail", () => {
    it("trims and lowercases", () => {
      expect(sanitizeEmail("  TEST@Example.COM  ")).toBe("test@example.com");
    });

    it("limits to 255 characters", () => {
      const long = "a".repeat(300) + "@example.com";
      expect(sanitizeEmail(long).length).toBe(255);
    });
  });

  describe("sanitizeNumber", () => {
    it("parses valid number string", () => {
      expect(sanitizeNumber("150.50")).toBe(150.5);
    });

    it("returns number as-is", () => {
      expect(sanitizeNumber(100)).toBe(100);
    });

    it("returns 0 for NaN", () => {
      expect(sanitizeNumber("abc")).toBe(0);
    });

    it("returns 0 for infinite", () => {
      expect(sanitizeNumber(Infinity)).toBe(0);
    });

    it("rounds to 2 decimal places", () => {
      expect(sanitizeNumber(10.123456)).toBe(10.12);
    });
  });

  describe("sanitizeNote", () => {
    it("trims whitespace", () => {
      expect(sanitizeNote("  note  ")).toBe("note");
    });

    it("removes HTML tags", () => {
      expect(sanitizeNote("<b>bold</b>")).toBe("bbold/b");
    });

    it("limits to 1000 characters", () => {
      const long = "a".repeat(1200);
      expect(sanitizeNote(long).length).toBe(1000);
    });
  });
});
