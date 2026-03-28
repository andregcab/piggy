import { useState } from 'react';
import type { TransactionRow } from '@/types';
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
    dateChanged?: boolean;
  },
  unknown
>;

export function useTransactionEditState(
  updateMutation: UpdateMutation,
) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<'debit' | 'credit'>('debit');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(
    null,
  );
  const [editNotes, setEditNotes] = useState('');
  const [editOriginalDate, setEditOriginalDate] = useState('');

  const handleEditStart = (tx: TransactionRow) => {
    setEditId(tx.id);
    const day = tx.date.slice(0, 10);
    setEditDate(day);
    setEditOriginalDate(day);
    setEditDescription(tx.description);
    setEditAmount(Math.abs(parseFloat(tx.amount)).toFixed(2));
    setEditType(parseFloat(tx.amount) < 0 ? 'debit' : 'credit');
    setEditCategoryId(tx.category?.id ?? null);
    setEditNotes(tx.notes ?? '');
  };

  const handleEditCancel = () => setEditId(null);

  const handleEditSave = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const amt = parseFloat(editAmount);
    if (!Number.isNaN(amt) && amt > 0) {
      updateMutation.mutate(
        {
          id,
          body: {
            date: editDate,
            description: editDescription.trim(),
            type: editType,
            amount: amt,
            categoryId: editCategoryId,
            notes: editNotes.trim() || null,
          },
          dateChanged: editDate !== editOriginalDate,
        },
        { onSuccess: () => setEditId(null) },
      );
    }
  };

  return {
    editId,
    editDate,
    editDescription,
    editAmount,
    editType,
    editCategoryId,
    editNotes,
    setEditDate,
    setEditDescription,
    setEditAmount,
    setEditType,
    setEditCategoryId,
    setEditNotes,
    handleEditStart,
    handleEditCancel,
    handleEditSave,
  };
}
