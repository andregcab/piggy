import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reApplyCategories,
  upsertBudget,
  removeBudget,
} from '@/api/categories';
import { toast } from 'sonner';
import { getMutationErrorMessage } from '@/lib/error-utils';

const INVALIDATE_KEYS = [
  'categories',
  'transactions',
  'category-budgets',
  'analytics',
  'monthly',
];

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    INVALIDATE_KEYS.forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] }),
    );
  };

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      try {
        const now = new Date();
        const { updated } = await reApplyCategories(
          now.getFullYear(),
          now.getMonth() + 1,
        );
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        toast.success(
          updated > 0
            ? `Category added. ${updated} transaction(s) updated this month.`
            : 'Category added.',
        );
      } catch {
        toast.success('Category added.');
      }
    },
    onError: (err) => {
      toast.error(
        getMutationErrorMessage(err, 'Failed to add category'),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: {
        name?: string;
        isActive?: boolean;
        isFixed?: boolean;
        keywords?: string[];
      };
    }) => updateCategory(id, body),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      try {
        const now = new Date();
        const { updated } = await reApplyCategories(
          now.getFullYear(),
          now.getMonth() + 1,
        );
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        if (updated > 0) {
          toast.success(
            `${updated} transaction(s) updated this month.`,
          );
        }
      } catch {
        // Re-apply failed; category update still succeeded
      }
    },
    onError: (err) => {
      toast.error(
        getMutationErrorMessage(err, 'Failed to update category'),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({
      id,
      migrateTo,
    }: {
      id: string;
      migrateTo?: string;
    }) => deleteCategory(id, migrateTo),
    onSuccess: () => {
      invalidateAll();
      toast.success('Category deleted.');
    },
    onError: (err) => {
      toast.error(
        getMutationErrorMessage(err, 'Failed to delete category'),
      );
    },
  });

  const budgetMutation = useMutation({
    mutationFn: ({
      categoryId,
      amount,
    }: {
      categoryId: string;
      amount: number;
    }) => upsertBudget(categoryId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['category-budgets'],
      });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const removeBudgetMutation = useMutation({
    mutationFn: removeBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['category-budgets'],
      });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const keywordsMutation = useMutation({
    mutationFn: ({
      id,
      keywords,
    }: {
      id: string;
      keywords: string[];
    }) => updateCategory(id, { keywords }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      try {
        const now = new Date();
        const { updated } = await reApplyCategories(
          now.getFullYear(),
          now.getMonth() + 1,
        );
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        if (updated > 0) {
          toast.success(
            `${updated} transaction(s) updated this month.`,
          );
        }
      } catch {
        // Re-apply failed; keywords update still succeeded
      }
    },
    onError: (err) => {
      toast.error(
        getMutationErrorMessage(err, 'Failed to save keywords'),
      );
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    budgetMutation,
    removeBudgetMutation,
    keywordsMutation,
  };
}
