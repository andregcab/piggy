import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import type { Category } from '@/types';
import type { UseMutationResult } from '@tanstack/react-query';

type DeleteCategoryMutation = UseMutationResult<
  unknown,
  Error,
  { id: string; migrateTo?: string },
  unknown
>;

type CategoryDeleteDialogProps = {
  target: { id: string; name: string; transactionCount: number } | null;
  categories: Category[];
  migrateToId: string;
  onMigrateChange: (id: string) => void;
  onClose: () => void;
  deleteMutation: DeleteCategoryMutation;
};

export function CategoryDeleteDialog({
  target,
  categories,
  migrateToId,
  onMigrateChange,
  onClose,
  deleteMutation,
}: CategoryDeleteDialogProps) {
  const [dialogContentEl, setDialogContentEl] =
    useState<HTMLElement | null>(null);

  return (
    <Dialog open={target != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent ref={setDialogContentEl}>
        <DialogHeader>
          <DialogTitle>Delete &quot;{target?.name}&quot;</DialogTitle>
        </DialogHeader>
        {target && (
          <>
            <p className="text-muted-foreground text-sm">
              {target.transactionCount === 0
                ? 'No transactions use this category.'
                : `${target.transactionCount} transaction${target.transactionCount === 1 ? '' : 's'} use this category.`}
            </p>
            {target.transactionCount > 0 && (
              <div className="grid gap-2 py-2">
                <Label>Migrate to</Label>
                <Combobox
                  options={categories
                    .filter((c) => c.id !== target.id)
                    .map((c) => ({ value: c.id, label: c.name }))}
                  value={migrateToId || null}
                  onValueChange={(v) => onMigrateChange(v ?? '')}
                  placeholder="Select category (optional)"
                  searchPlaceholder="Type to search..."
                  popoverPortalContainer={dialogContentEl}
                  allowEmpty
                  emptyOption={{
                    value: null,
                    label: "Don't migrate",
                  }}
                />
              </div>
            )}
          </>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (target) {
                deleteMutation.mutate(
                  {
                    id: target.id,
                    migrateTo: migrateToId || undefined,
                  },
                  { onSuccess: onClose },
                );
              }
            }}
            disabled={deleteMutation.isPending}
          >
            {migrateToId ? 'Migrate and delete' : 'Delete and uncategorize'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
