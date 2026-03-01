import type { TransactionRow } from '@/types';
import type { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  formatAmount,
  formatDateToMMDDYY,
  formatTransactionAmount,
  formatTransactionDateDisplay,
  getMyShareDisplay,
  parseMMDDYYToISO,
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

type TransactionTableRowProps = {
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

function EditDateInput({
  editDate,
  onEditDateChange,
  formId,
}: {
  editDate: string;
  onEditDateChange: (iso: string) => void;
  formId: string;
}) {
  const [dateInputValue, setDateInputValue] = useState(() =>
    formatDateToMMDDYY(editDate),
  );
  const handleChange = (value: string) => {
    setDateInputValue(value);
    const iso = parseMMDDYYToISO(value);
    if (iso) onEditDateChange(iso);
  };
  return (
    <Input
      type="text"
      inputMode="numeric"
      placeholder="M/D/YY"
      value={dateInputValue}
      onChange={(e) => handleChange(e.target.value)}
      className="h-8 w-full min-w-0 pl-2 -ml-2 font-mono"
      form={formId}
    />
  );
}

export function TransactionTableRow({
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
}: TransactionTableRowProps) {
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

  const toggleExclude = () => {
    updateMutation.mutate({
      id: transaction.id,
      body: { isExcluded: !transaction.isExcluded },
    });
  };

  return (
    <TableRow
      className={cn(
        '[&>td]:min-h-[3.25rem]', // Cells control row height; tr min-height is unreliable
        transaction.isExcluded && 'opacity-50 bg-muted/30',
      )}
    >
      <TableCell className="min-w-[100px] w-[100px]">
        {isEditing ? (
          <EditDateInput
            editDate={editDate}
            onEditDateChange={onEditDateChange}
            formId={`edit-tx-form-${transaction.id}`}
          />
        ) : (
          formatTransactionDateDisplay(transaction.date)
        )}
      </TableCell>
      <TableCell
        className={cn(
          'min-w-0 max-w-[220px] overflow-hidden',
          !isEditing && 'truncate',
        )}
        title={!isEditing ? transaction.description : undefined}
      >
        {isEditing ? (
          <Input
            value={editDescription}
            onChange={(e) => onEditDescriptionChange(e.target.value)}
            className="h-8 w-full min-w-0 max-w-full text-sm pl-2 -ml-2 overflow-hidden text-ellipsis"
            form={`edit-tx-form-${transaction.id}`}
            title={editDescription}
          />
        ) : (
          transaction.description
        )}
      </TableCell>
      <TableCell className="min-w-[8.5rem] w-[8.5rem] shrink-0 text-right font-mono align-middle whitespace-nowrap">
        {isEditing ? (
          <div className="flex items-center justify-end gap-3">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={editAmount}
              onChange={(e) => onEditAmountChange(e.target.value)}
              className="h-8 w-[5.5rem] min-w-0 text-right pl-2 pr-2 -mr-2 font-mono tabular-nums"
              form={`edit-tx-form-${transaction.id}`}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 min-w-0 px-2 text-xs rounded font-mono shrink-0 border-input bg-muted/30"
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
        ) : (
          <span
            title={
              myShareVal != null
                ? `Total: ${formatAmount(transaction.amount)}`
                : undefined
            }
          >
            {formatTransactionAmount(transaction)}
          </span>
        )}
      </TableCell>
      <TableCell className="w-[150px] min-w-[120px]">
        <div className="flex flex-wrap gap-1 text-xs">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'h-6 px-2.5 py-1',
              transaction.isExcluded &&
                'border-flag-active/55 bg-flag-active/35 text-flag-active-foreground hover:bg-flag-active/45',
            )}
            onClick={toggleExclude}
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
      </TableCell>
      <TableCell className="w-[160px]">
        {isEditing ? (
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
            triggerClassName="h-8 w-[160px] -ml-2 pl-2"
          />
        ) : (
          <span className="text-muted-foreground">
            {transaction.category?.name ?? '—'}
          </span>
        )}
      </TableCell>
      <TableCell className="w-[120px] min-w-[100px] max-w-[120px]">
        {isEditing ? (
          <Input
            value={editNotes}
            onChange={(e) => onEditNotesChange(e.target.value)}
            placeholder="Notes"
            className="h-8 w-full min-w-0 pl-2 -ml-2"
            form={`edit-tx-form-${transaction.id}`}
          />
        ) : transaction.notes ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-muted-foreground text-sm truncate block min-w-0 cursor-default">
                {transaction.notes}
              </span>
            </TooltipTrigger>
            <TooltipContent>{transaction.notes}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground text-sm truncate block min-w-0 cursor-default">
            —
          </span>
        )}
      </TableCell>
      <TableCell className="w-20 shrink-0">
        {isEditing ? (
          <div className="flex gap-1 shrink-0">
            <form
              id={`edit-tx-form-${transaction.id}`}
              onSubmit={onEditSave}
              className="contents"
            >
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground dark:text-primary dark:hover:text-primary"
                title="Save"
                aria-label="Save"
              >
                <Check className="h-4 w-4" />
              </Button>
            </form>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onEditCancel}
              title="Cancel"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEditStart(transaction)}
              title="Edit"
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(transaction)}
              title="Delete"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
