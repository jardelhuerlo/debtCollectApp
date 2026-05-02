import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLoans,
  createLoan,
  deleteLoan,
  fetchPayments,
  registerPayment,
  registerZeroPayment,
} from "@/services/loans.service";
import { getCurrentUser } from "@/services/auth.service";
import { showError } from "@/lib/toast";
import type { Loan, Payment, PaymentMethod } from "@/types";

const LOANS_KEY = "loans";

export function useLoansQuery() {
  return useQuery<Loan[]>({
    queryKey: [LOANS_KEY],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("No user");
      const { data, error } = await fetchLoans(user.id);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateLoanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      debtorName: string;
      amount: number;
      interes: number;
      paymentMethod: PaymentMethod;
      note?: string;
    }) => {
      const user = await getCurrentUser();
      if (!user) throw new Error("No user");
      const { error } = await createLoan({ ownerId: user.id, ...params });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOANS_KEY] });
    },
  });
}

export function useDeleteLoanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loanId: string) => {
      const { error } = await deleteLoan(loanId);
      if (error) throw error;
    },
    onMutate: async (loanId) => {
      await queryClient.cancelQueries({ queryKey: [LOANS_KEY] });
      const previous = queryClient.getQueryData<Loan[]>([LOANS_KEY]);

      queryClient.setQueryData<Loan[]>([LOANS_KEY], (old) =>
        old ? old.filter((l) => l.id !== loanId) : old
      );

      return { previous };
    },
    onError: (_err, _loanId, context) => {
      if (context?.previous) {
        queryClient.setQueryData([LOANS_KEY], context.previous);
      }
      showError("Error", "No se pudo eliminar el préstamo");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [LOANS_KEY] });
    },
  });
}

export function usePaymentsQuery(loanId: string | null) {
  return useQuery<Payment[]>({
    queryKey: ["payments", loanId],
    queryFn: async () => {
      if (!loanId) throw new Error("No loanId");
      const { data, error } = await fetchPayments(loanId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!loanId,
  });
}

export function useRegisterPaymentMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      loanId: string;
      amount: number;
      note?: string;
      method: PaymentMethod;
    }) => {
      const user = await getCurrentUser();
      if (!user) throw new Error("No user");
      const { error } = await registerPayment({ payerId: user.id, ...params });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOANS_KEY] });
      onSuccess?.();
    },
  });
}

export function useRegisterZeroPaymentMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loanId: string) => {
      const user = await getCurrentUser();
      if (!user) throw new Error("No user");
      const { error } = await registerZeroPayment({ loanId, payerId: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOANS_KEY] });
      onSuccess?.();
    },
  });
}

export type { Loan, Payment } from "@/types";
