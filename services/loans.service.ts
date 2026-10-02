import { supabase } from "@/lib/supabase";
import type { Loan, Payment, SupabaseResult, SupabaseMutationResult, PaymentMethod } from "@/types";
import { sanitizeString, sanitizeNote, sanitizeNumber } from "@/lib/sanitize";

export async function fetchLoans(ownerId: string): Promise<SupabaseResult<Loan[]>> {
  const { data, error } = await supabase
    .from("loans")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };
  return { data: data as Loan[], error: null };
}

export async function createLoan(params: {
  ownerId: string;
  debtorName: string;
  amount: number;
  interes: number;
  paymentMethod: PaymentMethod;
  note?: string;
  renewedFrom?: string;
}): Promise<SupabaseMutationResult> {
  const { error } = await supabase.rpc("create_loan_with_interest", {
    p_renewed_from: params.renewedFrom ?? null,
    p_owner_id: params.ownerId,
    p_debtor_name: sanitizeString(params.debtorName),
    p_amount: sanitizeNumber(params.amount),
    p_interes: sanitizeNumber(params.interes),
    p_payment_method: params.paymentMethod,
    p_note: params.note ? sanitizeNote(params.note) : "",
  });

  return { error };
}

export async function deleteLoan(loanId: string): Promise<SupabaseMutationResult> {
  const { error } = await supabase.from("loans").delete().eq("id", loanId);
  return { error };
}

export async function fetchPayments(loanId: string): Promise<SupabaseResult<Payment[]>> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("loan_id", loanId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };
  return { data: data as Payment[], error: null };
}

export async function registerPayment(params: {
  loanId: string;
  payerId: string;
  amount: number;
  note?: string;
  method: PaymentMethod;
}): Promise<SupabaseMutationResult> {
  const { error } = await supabase.rpc("process_payment", {
    p_loan_id: params.loanId,
    p_payer_id: params.payerId,
    p_amount: sanitizeNumber(params.amount),
    p_note: params.note ? sanitizeNote(params.note) : null,
    p_method: params.method,
  });

  return { error };
}

export async function registerZeroPayment(params: {
  loanId: string;
  payerId: string;
}): Promise<SupabaseMutationResult> {
  const currentDate = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { error } = await supabase.rpc("process_payment", {
    p_loan_id: params.loanId,
    p_payer_id: params.payerId,
    p_amount: 0,
    p_note: `Día sin pago - ${currentDate}`,
    p_method: "sin_pago",
  });

  return { error };
}

export type { Loan, Payment } from "@/types";
