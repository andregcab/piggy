import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateTransaction,
  deleteTransaction,
  createTransaction,
  deleteTransactionsByDateRange,
} from '@/api/transactions';
import type { TransactionRow, TransactionsResponse } from '@/types';
import { toast } from 'sonner';
import { getMutationErrorMessage } from '@/lib/error-utils';

export function useTransactionMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  };

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: {
        date?: string;
        description?: string;
        categoryId?: string | null;
        notes?: string | null;
        isExcluded?: boolean;
        amount?: number;
        myShare?: number | null;
      };
    }) => updateTransaction(id, body),
    onSuccess: (updated: TransactionRow) => {
      // Update cache in place so list order is preserved (no refetch).
      queryClient.setQueriesData<TransactionsResponse>(
        { queryKey: ['transactions'] },
        (old) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((t) =>
              t.id === updated.id ? updated : t,
            ),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err) => {
      toast.error(
        getMutationErrorMessage(err, 'Failed to update transaction'),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: invalidate,
    onError: (err) => {
      toast.error(
        getMutationErrorMessage(err, 'Failed to delete transaction'),
      );
    },
  });

  const deleteMonthMutation = useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) =>
      deleteTransactionsByDateRange(from, to),
    onSuccess: invalidate,
    onError: (err) => {
      toast.error(
        getMutationErrorMessage(err, 'Failed to delete transactions'),
      );
    },
  });

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: invalidate,
    onError: (err) => {
      toast.error(
        getMutationErrorMessage(err, 'Failed to add transaction'),
      );
    },
  });

  return {
    updateMutation,
    deleteMutation,
    deleteMonthMutation,
    createMutation,
  };
}
