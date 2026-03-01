import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/transaction-utils';
import type { UseMutationResult } from '@tanstack/react-query';

type Account = { id: string; name: string };
type Category = { id: string; name: string };

type AddTransactionMutation = UseMutationResult<
  unknown,
  Error,
  {
    accountId: string;
    date: string;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
    categoryId?: string | null;
    notes?: string | null;
  },
  unknown
>;

type AddTransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  categories: Category[];
  defaultAccountId: string;
  defaultCategoryId: string | null;
  createMutation: AddTransactionMutation;
};

function AddTransactionForm({
  accounts,
  categories,
  defaultAccountId,
  defaultCategoryId,
  createMutation,
  onClose,
}: {
  accounts: Account[];
  categories: Category[];
  defaultAccountId: string;
  defaultCategoryId: string | null;
  createMutation: AddTransactionMutation;
  onClose: () => void;
}) {
  const [form, setForm] = useState(() => ({
    accountId: defaultAccountId || (accounts[0]?.id ?? ''),
    date: new Date().toISOString().slice(0, 10),
    description: '',
    amount: '',
    myShare: '' as string,
    type: 'debit' as 'debit' | 'credit',
    categoryId: defaultCategoryId ?? null,
    notes: '',
  }));
  const [showValidation, setShowValidation] = useState(false);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const amt = parseFloat(form.amount);
  const amountValid = !Number.isNaN(amt) && amt > 0;
  const hasAccount = Boolean(form.accountId);
  const hasDescription = Boolean(form.description.trim());
  const hasAmount = Boolean(form.amount);
  const isFormValid =
    hasAccount && hasDescription && hasAmount && amountValid;

  useEffect(() => {
    if (!showValidation) return;
    if (!hasDescription) descriptionRef.current?.focus();
    else if (!hasAmount || !amountValid) amountRef.current?.focus();
  }, [showValidation, hasDescription, hasAmount, amountValid]);

  const absAmt = Math.abs(amt);
  const myShareNum = form.myShare ? parseFloat(form.myShare) : null;
  const isHalfSplit =
    amt > 0 &&
    myShareNum != null &&
    Math.abs(myShareNum - absAmt / 2) < 0.01;

  const handleHalfClick = () => {
    if (!form.amount || amt <= 0) return;
    if (isHalfSplit) {
      setForm((f) => ({ ...f, myShare: '' }));
    } else {
      setForm((f) => ({
        ...f,
        myShare: (Math.abs(amt) / 2).toFixed(2),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setShowValidation(true);
      return;
    }
    const amt = parseFloat(form.amount);
    createMutation.mutate(
      {
        accountId: form.accountId,
        date: form.date,
        description: form.description.trim(),
        amount: amt,
        ...(form.myShare &&
          parseFloat(form.myShare) > 0 && {
            myShare: parseFloat(form.myShare),
          }),
        type: form.type,
        categoryId: form.categoryId || null,
        notes: form.notes.trim() || null,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add transaction</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label>Account</Label>
          <Combobox
            options={accounts.map((a) => ({
              value: a.id,
              label: a.name,
            }))}
            value={form.accountId || null}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, accountId: v ?? '' }))
            }
            placeholder="Select account"
            searchPlaceholder="Type to search..."
            triggerClassName={cn(
              'w-full',
              showValidation && !hasAccount && 'border-destructive',
            )}
          />
          {showValidation && !hasAccount && (
            <p id="add-account-error" className="text-sm text-destructive">
              Select an account
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="add-date">Date</Label>
          <DatePicker
            id="add-date"
            value={form.date}
            onChange={(v) => setForm((f) => ({ ...f, date: v }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="add-description">Description</Label>
          <Input
            ref={descriptionRef}
            id="add-description"
            placeholder="e.g. Coffee shop"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className={cn(
              showValidation &&
                !hasDescription &&
                'border-destructive',
            )}
            aria-invalid={showValidation && !hasDescription}
            aria-describedby={
              showValidation && !hasDescription
                ? 'add-description-error'
                : undefined
            }
          />
          {showValidation && !hasDescription && (
            <p id="add-description-error" className="text-sm text-destructive">
              Description is required
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="add-amount">Amount</Label>
            <div className="flex gap-2">
              <Input
                ref={amountRef}
                id="add-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    amount: e.target.value,
                    myShare: '',
                  }))
                }
                className={cn(
                  showValidation &&
                    (!hasAmount || !amountValid) &&
                    'border-destructive',
                )}
                aria-invalid={showValidation && (!hasAmount || !amountValid)}
                aria-describedby={
                  showValidation && (!hasAmount || !amountValid)
                    ? 'add-amount-error'
                    : undefined
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleHalfClick}
                disabled={!form.amount || amt <= 0}
                title={isHalfSplit ? 'Clear split' : 'Split 50/50'}
              >
                ½
              </Button>
            </div>
            {showValidation && (!hasAmount || !amountValid) && (
              <p id="add-amount-error" className="text-sm text-destructive">
                {!hasAmount
                  ? 'Enter an amount'
                  : 'Amount must be greater than 0'}
              </p>
            )}
            {form.myShare && (
              <p className="text-xs text-muted-foreground">
                My share: {formatCurrency(parseFloat(form.myShare))}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-type">Type</Label>
            <Select
              value={form.type}
              onValueChange={(v: 'debit' | 'credit') =>
                setForm((f) => ({ ...f, type: v }))
              }
            >
              <SelectTrigger id="add-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debit">Expense</SelectItem>
                <SelectItem value="credit">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="add-category">Category</Label>
          <Combobox
            id="add-category"
            options={categories.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            value={form.categoryId}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, categoryId: v }))
            }
            placeholder="Optional"
            searchPlaceholder="Type to search..."
            allowEmpty
            emptyOption={{ value: null, label: '—' }}
            triggerClassName="w-full"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="add-notes">Notes</Label>
          <Input
            id="add-notes"
            placeholder="Optional"
            value={form.notes}
            onChange={(e) =>
              setForm((f) => ({ ...f, notes: e.target.value }))
            }
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Adding...' : 'Add'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  accounts,
  categories,
  defaultAccountId,
  defaultCategoryId,
  createMutation,
}: AddTransactionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open ? (
          <AddTransactionForm
            accounts={accounts}
            categories={categories}
            defaultAccountId={defaultAccountId}
            defaultCategoryId={defaultCategoryId}
            createMutation={createMutation}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
