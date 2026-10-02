export type PaymentMethod = "efectivo" | "transferencia" | "sin_pago";
export type LoanStatus = "pendiente" | "pagado" | "vencido";

export interface Loan {
  id: string;
  owner_id: string;
  debtor_name: string;
  original_amount: number;
  remaining: number;
  status: LoanStatus;
  payment_method: PaymentMethod | null;
  note: string | null;
  interes: number;
  last_payment_was_zero: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  loan_id: string;
  payer_id: string;
  amount: number;
  note: string | null;
  method: PaymentMethod | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: string;
  is_active: boolean;
  subscription_expires: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface SupabaseResult<T> {
  data: T | null;
  error: Error | null;
}

export interface SupabaseMutationResult {
  error: Error | null;
}
