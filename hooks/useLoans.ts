import { useCallback, useState } from "react";
import {
  fetchLoans,
  createLoan,
  deleteLoan,
  fetchPayments,
  registerPayment,
  registerZeroPayment,
} from "@/services/loans.service";
import { getCurrentUser } from "@/services/auth.service";
import type { Loan, Payment, PaymentMethod } from "@/types";

interface UseLoansReturn {
  loans: Loan[];
  isLoading: boolean;
  isRefreshing: boolean;
  isProcessing: boolean;
  loadLoans: () => Promise<void>;
  refreshLoans: () => Promise<void>;
  createLoan: (params: {
    debtorName: string;
    amount: number;
    interes: number;
    paymentMethod: PaymentMethod;
    note?: string;
  }) => Promise<{ error: Error | null }>;
  deleteLoan: (loanId: string) => Promise<{ error: Error | null }>;
  fetchPayments: (loanId: string) => Promise<{ data: Payment[] | null; error: Error | null }>;
  registerPayment: (params: {
    loanId: string;
    amount: number;
    note?: string;
    method: PaymentMethod;
  }) => Promise<{ error: Error | null }>;
  registerZeroPayment: (loanId: string) => Promise<{ error: Error | null }>;
}

export function useLoans(): UseLoansReturn {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadLoans = useCallback(async () => {
    const user = await getCurrentUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await fetchLoans(user.id);
    if (!error && data) setLoans(data);
    setIsLoading(false);
  }, []);

  const refreshLoans = useCallback(async () => {
    setIsRefreshing(true);
    await loadLoans();
    setIsRefreshing(false);
  }, [loadLoans]);

  const handleCreateLoan = useCallback(
    async (params: {
      debtorName: string;
      amount: number;
      interes: number;
      paymentMethod: PaymentMethod;
      note?: string;
    }) => {
      const user = await getCurrentUser();
      if (!user) return { error: new Error("No user") };

      return await createLoan({
        ownerId: user.id,
        ...params,
      });
    },
    []
  );

  const handleDeleteLoan = useCallback(async (loanId: string) => {
    const { error } = await deleteLoan(loanId);
    if (!error) {
      setLoans((prev) => prev.filter((l) => l.id !== loanId));
    }
    return { error };
  }, []);

  const handleFetchPayments = useCallback(async (loanId: string) => {
    return await fetchPayments(loanId);
  }, []);

  const handleRegisterPayment = useCallback(
    async (params: { loanId: string; amount: number; note?: string; method: PaymentMethod }) => {
      setIsProcessing(true);
      const user = await getCurrentUser();
      if (!user) {
        setIsProcessing(false);
        return { error: new Error("No user") };
      }

      const result = await registerPayment({
        payerId: user.id,
        ...params,
      });

      if (!result.error) {
        await loadLoans();
      }

      setIsProcessing(false);
      return result;
    },
    [loadLoans]
  );

  const handleRegisterZeroPayment = useCallback(
    async (loanId: string) => {
      setIsProcessing(true);
      const user = await getCurrentUser();
      if (!user) {
        setIsProcessing(false);
        return { error: new Error("No user") };
      }

      const result = await registerZeroPayment({
        loanId,
        payerId: user.id,
      });

      if (!result.error) {
        await loadLoans();
      }

      setIsProcessing(false);
      return result;
    },
    [loadLoans]
  );

  return {
    loans,
    isLoading,
    isRefreshing,
    isProcessing,
    loadLoans,
    refreshLoans,
    createLoan: handleCreateLoan,
    deleteLoan: handleDeleteLoan,
    fetchPayments: handleFetchPayments,
    registerPayment: handleRegisterPayment,
    registerZeroPayment: handleRegisterZeroPayment,
  };
}

export type { Loan, Payment } from "@/types";
