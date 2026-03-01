import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';

type Account = { id: string; name: string };
type Category = { id: string; name: string };

type TransactionFiltersCardProps = {
  accounts: Account[];
  categories: Category[];
  accountId: string;
  onAccountChange: (id: string) => void;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  fromDate: string;
  onFromDateChange: (v: string) => void;
  toDate: string;
  onToDateChange: (v: string) => void;
};

export function TransactionFiltersCard({
  accounts,
  categories,
  accountId,
  onAccountChange,
  categoryId,
  onCategoryChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
}: TransactionFiltersCardProps) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-2 min-w-0">
          <Label>Account</Label>
          <Combobox
            options={accounts.map((a) => ({
              value: a.id,
              label: a.name,
            }))}
            value={accountId || null}
            onValueChange={(v) => onAccountChange(v ?? '')}
            placeholder="All accounts"
            allowEmpty
            emptyOption={{ value: null, label: 'All accounts' }}
            triggerClassName="w-full sm:w-[180px]"
            searchable={false}
          />
        </div>
        <div className="grid gap-2 min-w-0">
          <Label>Category</Label>
          <Combobox
            options={categories.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            value={categoryId || null}
            onValueChange={(v) => onCategoryChange(v ?? '')}
            placeholder="All"
            allowEmpty
            emptyOption={{ value: null, label: 'All' }}
            triggerClassName="w-full sm:w-[180px]"
            searchable={false}
          />
        </div>
        <div className="grid gap-2 min-w-0">
          <Label>From date</Label>
          <DatePicker
            value={fromDate}
            onChange={onFromDateChange}
            triggerClassName="w-full min-w-0 sm:w-[160px]"
          />
        </div>
        <div className="grid gap-2 min-w-0">
          <Label>To date</Label>
          <DatePicker
            value={toDate}
            onChange={onToDateChange}
            triggerClassName="w-full min-w-0 sm:w-[160px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
