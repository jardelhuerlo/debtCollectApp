import { formatDate, formatMoney } from "@/lib/format";

describe("formatDate", () => {
  it("writes the month name so the day and month cannot be confused", () => {
    expect(formatDate("2026-10-02T12:00:00")).toBe("02 oct 2026");
    expect(formatDate("2026-01-15T12:00:00")).toBe("15 ene 2026");
  });

  it("returns an empty string for an invalid date", () => {
    expect(formatDate("no es fecha")).toBe("");
  });
});

describe("formatMoney", () => {
  it("shows whole amounts without decimals", () => {
    expect(formatMoney(400)).toBe("$400");
  });

  it("shows two decimals when needed", () => {
    expect(formatMoney(150.3)).toBe("$150.30");
    expect(formatMoney(0.1 + 0.2)).toBe("$0.30");
  });
});
