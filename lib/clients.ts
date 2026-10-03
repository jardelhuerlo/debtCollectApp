import type { Loan } from "@/types";

export interface ClientGroup {
  clientId: string;
  name: string;
  loans: Loan[];
  totalRemaining: number;
  activeCount: number;
  hasAlert: boolean;
  latestCreatedAt: string;
}

export function normalizeClientName(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function getLoanClientName(loan: Loan): string {
  return loan.client?.name ?? loan.debtor_name;
}

export function groupLoansByClient(loans: Loan[]): ClientGroup[] {
  const byClient = new Map<string, Loan[]>();
  for (const loan of loans) {
    const key = loan.client_id ?? `name:${normalizeClientName(loan.debtor_name)}`;
    const list = byClient.get(key);
    if (list) list.push(loan);
    else byClient.set(key, [loan]);
  }

  const groups: ClientGroup[] = [];
  for (const [clientId, clientLoans] of byClient) {
    const sorted = [...clientLoans].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const totalRemaining = sorted.reduce((sum, l) => sum + Number(l.remaining), 0);
    groups.push({
      clientId,
      name: getLoanClientName(sorted[0]),
      loans: sorted,
      totalRemaining: Math.round(totalRemaining * 100) / 100,
      activeCount: sorted.filter((l) => l.remaining > 0).length,
      hasAlert: sorted.some((l) => l.last_payment_was_zero && l.remaining > 0),
      latestCreatedAt: sorted[0].created_at,
    });
  }

  return groups.sort(
    (a, b) => b.latestCreatedAt.localeCompare(a.latestCreatedAt) || a.name.localeCompare(b.name)
  );
}

export function suggestClientNames(loans: Loan[], text: string, limit = 5): string[] {
  const query = normalizeClientName(text);
  if (!query) return [];

  const names = new Map<string, string>();
  for (const loan of loans) {
    const name = getLoanClientName(loan);
    names.set(normalizeClientName(name), name);
  }

  return [...names.entries()]
    .filter(([key]) => key.includes(query) && key !== query)
    .map(([, name]) => name)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, limit);
}
