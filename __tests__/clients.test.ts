import { groupLoansByClient, normalizeClientName, suggestClientNames } from "@/lib/clients";
import type { Loan } from "@/types";

function makeLoan(overrides: Partial<Loan> & { id: string }): Loan {
  return {
    owner_id: "owner-1",
    debtor_name: "Juan Pérez",
    original_amount: 100,
    remaining: 100,
    status: "pendiente",
    payment_method: "efectivo",
    note: null,
    interes: 10,
    last_payment_was_zero: false,
    renewed_from: null,
    renewal_number: 0,
    client_id: "client-juan",
    client: { id: "client-juan", name: "Juan Pérez" },
    created_at: "2026-10-01T10:00:00Z",
    ...overrides,
  };
}

describe("normalizeClientName", () => {
  it("ignores case, accents and repeated spaces", () => {
    expect(normalizeClientName("  JUAN   Pérez ")).toBe("juan perez");
    expect(normalizeClientName("Ángel Núñez")).toBe("angel nunez");
  });

  it("returns an empty string for blank input", () => {
    expect(normalizeClientName("   ")).toBe("");
  });
});

describe("groupLoansByClient", () => {
  it("returns an empty list when there are no loans", () => {
    expect(groupLoansByClient([])).toEqual([]);
  });

  it("groups loans of the same client together", () => {
    const groups = groupLoansByClient([
      makeLoan({ id: "a", created_at: "2026-10-01T10:00:00Z" }),
      makeLoan({ id: "b", created_at: "2026-10-03T10:00:00Z" }),
      makeLoan({
        id: "c",
        client_id: "client-ana",
        client: { id: "client-ana", name: "Ana" },
        debtor_name: "Ana",
      }),
    ]);

    expect(groups).toHaveLength(2);
    const juan = groups.find((g) => g.clientId === "client-juan");
    expect(juan?.loans.map((l) => l.id)).toEqual(["b", "a"]);
  });

  it("uses the client name from the join over the loan snapshot name", () => {
    const [group] = groupLoansByClient([
      makeLoan({
        id: "a",
        debtor_name: "juan  perez ",
        client: { id: "client-juan", name: "Juan Pérez" },
      }),
    ]);
    expect(group.name).toBe("Juan Pérez");
  });

  it("sums the remaining amount and counts active loans", () => {
    const [group] = groupLoansByClient([
      makeLoan({ id: "a", remaining: 100.1 }),
      makeLoan({ id: "b", remaining: 50.2 }),
      makeLoan({ id: "c", remaining: 0 }),
    ]);
    expect(group.totalRemaining).toBe(150.3);
    expect(group.activeCount).toBe(2);
  });

  it("flags the group when an unpaid loan had a day without payment", () => {
    const [group] = groupLoansByClient([
      makeLoan({ id: "a", last_payment_was_zero: true }),
      makeLoan({ id: "b" }),
    ]);
    expect(group.hasAlert).toBe(true);
  });

  it("does not flag a paid loan", () => {
    const [group] = groupLoansByClient([
      makeLoan({ id: "a", last_payment_was_zero: true, remaining: 0 }),
    ]);
    expect(group.hasAlert).toBe(false);
  });

  it("orders clients by their most recent loan", () => {
    const groups = groupLoansByClient([
      makeLoan({ id: "a", created_at: "2026-10-01T10:00:00Z" }),
      makeLoan({
        id: "b",
        client_id: "client-ana",
        client: { id: "client-ana", name: "Ana" },
        created_at: "2026-10-05T10:00:00Z",
      }),
    ]);
    expect(groups.map((g) => g.clientId)).toEqual(["client-ana", "client-juan"]);
  });

  it("falls back to the normalized name when a loan has no client id", () => {
    const groups = groupLoansByClient([
      makeLoan({
        id: "a",
        client_id: undefined as unknown as string,
        client: null,
        debtor_name: "Pedro Ruiz",
      }),
      makeLoan({
        id: "b",
        client_id: undefined as unknown as string,
        client: null,
        debtor_name: " pedro   RUIZ",
      }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].loans).toHaveLength(2);
  });
});

describe("suggestClientNames", () => {
  const loans = [
    makeLoan({ id: "a" }),
    makeLoan({ id: "b" }),
    makeLoan({
      id: "c",
      client_id: "client-ana",
      client: { id: "client-ana", name: "Juana Díaz" },
    }),
    makeLoan({ id: "d", client_id: "client-luis", client: { id: "client-luis", name: "Luis" } }),
  ];

  it("returns unique client names that contain the text, ignoring accents and case", () => {
    expect(suggestClientNames(loans, "JUAN")).toEqual(["Juan Pérez", "Juana Díaz"]);
    expect(suggestClientNames(loans, "perez")).toEqual(["Juan Pérez"]);
  });

  it("does not suggest a name that already matches exactly", () => {
    expect(suggestClientNames(loans, "luis")).toEqual([]);
  });

  it("returns nothing for blank text and respects the limit", () => {
    expect(suggestClientNames(loans, "  ")).toEqual([]);
    expect(suggestClientNames(loans, "ju", 1)).toHaveLength(1);
  });
});
