import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createExpectedFixedExpense,
  deleteExpectedFixedExpense,
} from '@/api/revenue';
import type { Category, ExpectedFixedItem } from '@/types';
import type { FixedCategoryDisplay } from '@/hooks/useDashboardData';
import { Button } from '@/components/ui/button';

type EditTarget = {
  categoryId: string;
  categoryName: string;
  amount: number;
};

function filterAndSortFixedCategories(
  categories: FixedCategoryDisplay[],
): FixedCategoryDisplay[] {
  return [...categories]
    .filter((c) => !(c.total === 0 && c.budget === 0))
    .sort((a, b) => {
      const aHasAmount = a.budget > 0 || a.total > 0;
      const bHasAmount = b.budget > 0 || b.total > 0;
      if (aHasAmount !== bHasAmount) return aHasAmount ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, {
        sensitivity: 'base',
      });
    });
}
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CardTitleWithInfo } from '@/components/ui/card-title-with-info';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/transaction-utils';
import { getMutationErrorMessage } from '@/lib/error-utils';

type ExpectedFixedCardProps = {
  year: number;
  month: number;
  fixedCategories: FixedCategoryDisplay[];
  expectedFixed: ExpectedFixedItem[];
  expectedByCategoryId: Record<string, ExpectedFixedItem>;
  fixedCategoriesForPicker: Category[];
  fixedTotal: number;
  invalidateKeys: string[];
};

export function ExpectedFixedCard({
  year,
  month,
  fixedCategories,
  expectedFixed,
  expectedByCategoryId,
  fixedCategoriesForPicker,
  fixedTotal,
  invalidateKeys,
}: ExpectedFixedCardProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(
    null,
  );
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');

  const addMutation = useMutation({
    mutationFn: createExpectedFixedExpense,
    onSuccess: () => {
      invalidateKeys.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      );
      setOpen(false);
      setCategoryId('');
      setAmount('');
    },
    onError: (err) => {
      toast.error(
        getMutationErrorMessage(
          err,
          'Failed to add expected expense',
        ),
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: deleteExpectedFixedExpense,
    onSuccess: () => {
      invalidateKeys.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      );
    },
    onError: (err) => {
      toast.error(
        getMutationErrorMessage(
          err,
          'Failed to remove expected expense',
        ),
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0 || !categoryId) return;
    addMutation.mutate({
      year,
      month,
      categoryId,
      amount: amt,
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setEditTarget(null);
      setCategoryId('');
      setAmount('');
    }
    setOpen(nextOpen);
  };

  const openForEdit = (category: FixedCategoryDisplay) => {
    setEditTarget({
      categoryId: category.id,
      categoryName: category.name,
      amount: category.budget,
    });
    setCategoryId(category.id);
    setAmount(category.budget > 0 ? String(category.budget) : '');
    setOpen(true);
  };

  const handleCategorySelect = (value: string) => {
    setCategoryId(value);
    const fixed = value
      ? fixedCategories.find((c) => c.id === value)
      : null;
    setAmount(fixed && fixed.budget > 0 ? String(fixed.budget) : '');
  };

  const handleClearOverride = () => {
    const expectedItem = categoryId
      ? expectedByCategoryId[categoryId]
      : null;
    if (!expectedItem) return;
    if (expectedItem.id.startsWith('inherited-')) {
      addMutation.mutate({
        year,
        month,
        categoryId: expectedItem.categoryId,
        amount: 0,
      });
    } else {
      removeMutation.mutate(expectedItem.id);
      setOpen(false);
      setEditTarget(null);
      setCategoryId('');
      setAmount('');
    }
  };

  if (fixedCategories.length === 0 && expectedFixed.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-4 gap-2">
          <CardTitleWithInfo
            title="Fixed bills this month"
            infoContent={
              <>Rent, subscriptions, insurance — predictable costs</>
            }
          />
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setEditTarget(null);
              setCategoryId('');
              setAmount('');
              setOpen(true);
            }}
          >
            Set for this month
          </Button>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="text-foreground">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editTarget
                      ? `Set amount for ${editTarget.categoryName}`
                      : 'Set fixed amount for this month'}
                  </DialogTitle>
                </DialogHeader>
                {!editTarget && (
                  <p className="text-muted-foreground text-sm mt-2">
                    Set or override the amount for this month. For
                    costs not in your tracked accounts (e.g. rent),
                    add a fixed category in{' '}
                    <Link
                      to="/categories"
                      className="underline"
                      onClick={() => setOpen(false)}
                    >
                      Categories
                    </Link>{' '}
                    first if needed.
                  </p>
                )}
                <div className="grid gap-4 py-4">
                  {editTarget ? (
                    <div className="grid gap-2">
                      <Label>Category</Label>
                      <p className="text-sm text-muted-foreground">
                        {editTarget.categoryName}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label htmlFor="expected-category">
                        Category
                      </Label>
                      {fixedCategoriesForPicker.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No fixed categories yet. Create one (e.g.
                          Rent) in{' '}
                          <Link
                            to="/categories"
                            className="underline"
                            onClick={() => setOpen(false)}
                          >
                            Categories
                          </Link>{' '}
                          and mark it as fixed.
                        </p>
                      ) : (
                        <Select
                          value={categoryId}
                          onValueChange={handleCategorySelect}
                        >
                          <SelectTrigger
                            id="expected-category"
                            className="bg-background text-foreground"
                          >
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {fixedCategoriesForPicker.map((cat) => (
                              <SelectItem
                                key={cat.id}
                                value={cat.id}
                                className="text-foreground"
                              >
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="expected-amount">Amount</Label>
                    <Input
                      id="expected-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-background text-foreground"
                    />
                  </div>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                  <div className="w-full sm:w-auto order-2 sm:order-1">
                    {categoryId &&
                      expectedByCategoryId[categoryId] && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={handleClearOverride}
                          disabled={
                            removeMutation.isPending ||
                            addMutation.isPending
                          }
                        >
                          Clear override for this month
                        </Button>
                      )}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        addMutation.isPending ||
                        !categoryId ||
                        amount === '' ||
                        parseFloat(amount) < 0
                      }
                    >
                      {editTarget ? 'Save' : 'Add'}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {filterAndSortFixedCategories(fixedCategories).map(
            (category) => {
              const actual = category.total;
              const expectedAmount = category.budget;
              const hasExpected = expectedAmount > 0;
              const isOver = category.over;
              const isUnder =
                hasExpected &&
                actual < expectedAmount &&
                Math.abs(actual - expectedAmount) > 0.01;
              const showVsExpected =
                hasExpected && Math.abs(actual - expectedAmount) > 0.01;
              const overageAmount = isOver
                ? actual - expectedAmount
                : 0;
              const underAmount = isUnder
                ? expectedAmount - actual
                : 0;
              return (
                <div
                  key={category.id}
                  className="group flex items-center justify-between text-sm"
                >
                  <span
                    className={
                      isOver
                        ? 'font-medium text-destructive'
                        : 'text-muted-foreground'
                    }
                  >
                    {category.name}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-8 shrink-0 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 hover:text-foreground"
                        onClick={() => openForEdit(category)}
                        disabled={
                          addMutation.isPending ||
                          removeMutation.isPending
                        }
                        title="Set amount for this month"
                        aria-label="Set amount for this month"
                      >
                        <Pencil className="h-3 w-3" aria-hidden />
                      </Button>
                    </span>
                    {formatCurrency(actual)}
                    {showVsExpected && (
                      <>
                        <span className="text-muted-foreground">
                          / {formatCurrency(expectedAmount)}
                        </span>
                        {isOver && (
                          <span className="font-medium text-destructive">
                            Over by {formatCurrency(overageAmount)}
                          </span>
                        )}
                        {isUnder && (
                          <span className="text-[var(--positive)]">
                            Under by {formatCurrency(underAmount)}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </div>
              );
            },
          )}
          <div className="flex items-center justify-between border-t border-border pt-2 mt-2 font-medium">
            <span>Total fixed</span>
            <span className="flex items-center gap-2">
              <span className="w-8 shrink-0" aria-hidden />
              {formatCurrency(fixedTotal)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
