import type { TransactionRow } from '@/types';
import type { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatAmount,
  formatTransactionAmount,
  formatTransactionDateDisplay,
  getMyShareDisplay,
} from '@/lib/transaction-utils';
import type { UseMutationResult } from '@tanstack/react-query';

type UpdateMutation = UseMutationResult<
  unknown,
  Error,
  {
    id: string;
    body: {
      date?: string;
      description?: string;
      categoryId?: string | null;
      notes?: string | null;
      isExcluded?: boolean;
      type?: 'debit' | 'credit';
      amount?: number;
      myShare?: number | null;
    };
  },
  unknown
>;

type TransactionCardProps = {
  transaction: TransactionRow;
  categories: Category[];
  onDelete: (tx: TransactionRow) => void;
  updateMutation: UpdateMutation;
  editId: string | null;
  editDate: string;
  editDescription: string;
  editAmount: string;
  editType: 'debit' | 'credit';
  editCategoryId: string | null;
  editNotes: string;
  onEditDateChange: (v: string) => void;
  onEditDescriptionChange: (v: string) => void;
  onEditAmountChange: (v: string) => void;
  onEditTypeChange: (v: 'debit' | 'credit') => void;
  onEditCategoryIdChange: (v: string | null) => void;
  onEditNotesChange: (v: string) => void;
  onEditSave: (e: React.FormEvent) => void;
  onEditCancel: () => void;
  onEditStart: (tx: TransactionRow) => void;
};

export function TransactionCard({
  transaction,
  categories,
  onDelete,
  updateMutation,
  editId,
  editDate,
  editDescription,
  editAmount,
  editType,
  editCategoryId,
  editNotes,
  onEditDateChange,
  onEditDescriptionChange,
  onEditAmountChange,
  onEditTypeChange,
  onEditCategoryIdChange,
  onEditNotesChange,
  onEditSave,
  onEditCancel,
  onEditStart,
}: TransactionCardProps) {
  const isEditing = editId === transaction.id;
  const { myShareVal, isHalfSplit } = getMyShareDisplay(transaction);
  const absAmt = Math.abs(parseFloat(transaction.amount));

  const handleHalfClick = () => {
    if (isHalfSplit) {
      updateMutation.mutate({
        id: transaction.id,
        body: { myShare: null },
      });
    } else {
      updateMutation.mutate({
        id: transaction.id,
        body: { myShare: absAmt / 2 },
      });
    }
  };

  if (isEditing) {
    return (
      <Card
        className={
          transaction.isExcluded ? 'text-muted-foreground' : ''
        }
      >
        <CardContent className="p-3">
          <form
            id={`edit-tx-card-form-${transaction.id}`}
            onSubmit={onEditSave}
            className="space-y-3"
          >
            <div className="grid gap-2">
              <Label htmlFor={`tx-date-${transaction.id}`}>
                Date
              </Label>
              <DatePicker
                id={`tx-date-${transaction.id}`}
                value={editDate}
                onChange={onEditDateChange}
                triggerClassName="h-8"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`tx-desc-${transaction.id}`}>
                Description
              </Label>
              <Input
                id={`tx-desc-${transaction.id}`}
                value={editDescription}
                onChange={(e) =>
                  onEditDescriptionChange(e.target.value)
                }
                placeholder="Description"
                className="h-8"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`tx-amount-${transaction.id}`}>
                Amount
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id={`tx-amount-${transaction.id}`}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editAmount}
                  onChange={(e) => onEditAmountChange(e.target.value)}
                  className="h-8 w-[5.5rem]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 min-w-0 px-2.5 text-xs rounded font-mono border-input bg-muted/30"
                  onClick={() =>
                    onEditTypeChange(editType === 'debit' ? 'credit' : 'debit')
                  }
                  title={
                    editType === 'debit'
                      ? 'Expense — click to switch to Income'
                      : 'Income — click to switch to Expense'
                  }
                  aria-pressed={editType === 'debit'}
                  aria-label={`Type: ${editType === 'debit' ? 'Expense' : 'Income'}. Click to toggle.`}
                >
                  <span
                    className={
                      editType === 'debit'
                        ? 'text-primary font-semibold'
                        : 'text-muted-foreground'
                    }
                  >
                    −
                  </span>
                  <span className="text-muted-foreground/60">/</span>
                  <span
                    className={
                      editType === 'credit'
                        ? 'text-primary font-semibold'
                        : 'text-muted-foreground'
                    }
                  >
                    +
                  </span>
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Combobox
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                value={editCategoryId}
                onValueChange={(v) => onEditCategoryIdChange(v)}
                placeholder="—"
                searchPlaceholder="Type to search..."
                allowEmpty
                emptyOption={{ value: null, label: '—' }}
                triggerClassName="w-full"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`tx-notes-${transaction.id}`}>
                Notes
              </Label>
              <Input
                id={`tx-notes-${transaction.id}`}
                value={editNotes}
                onChange={(e) => onEditNotesChange(e.target.value)}
                placeholder="Notes"
                className="h-8"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm">
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEditCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={
        transaction.isExcluded ? 'text-muted-foreground' : ''
      }
    >
      <CardContent className="p-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p
              className="font-medium truncate"
              title={transaction.description}
            >
              {transaction.description}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatTransactionDateDisplay(transaction.date)}
            </p>
            <p
              className="mt-0.5 text-sm font-mono"
              title={
                myShareVal != null
                  ? `Total: ${formatAmount(transaction.amount)}`
                  : undefined
              }
            >
              {formatTransactionAmount(transaction)}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEditStart(transaction)}
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(transaction)}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 text-xs">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'h-6 px-2.5 py-1',
                transaction.isExcluded &&
                  'border-flag-active/55 bg-flag-active/35 text-flag-active-foreground hover:bg-flag-active/45',
              )}
              onClick={() =>
                updateMutation.mutate({
                  id: transaction.id,
                  body: { isExcluded: !transaction.isExcluded },
                })
              }
              title={
                transaction.isExcluded
                  ? 'Include in budget'
                  : 'Omit from budget'
              }
            >
              Omit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'h-6 px-2.5 py-1',
                myShareVal != null &&
                  'border-flag-active/55 bg-flag-active/35 text-flag-active-foreground hover:bg-flag-active/45',
              )}
              onClick={handleHalfClick}
              title={
                isHalfSplit ? 'Clear 50/50 split' : 'Split this 50/50'
              }
            >
              Split
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              Category:{' '}
            </span>
            {transaction.category?.name ?? '—'}
          </p>
          {transaction.notes && (
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs text-muted-foreground truncate cursor-default">
                  <span className="font-medium text-foreground">
                    Notes:{' '}
                  </span>
                  {transaction.notes}
                </p>
              </TooltipTrigger>
              <TooltipContent>{transaction.notes}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
