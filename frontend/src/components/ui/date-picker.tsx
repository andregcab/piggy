import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { isoDateStringToDate, dateToIsoDateString } from '@/lib/date-utils';

type DatePickerProps = {
  /** Value as YYYY-MM-DD */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  triggerClassName?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function DatePicker({
  value,
  onChange,
  id,
  className,
  triggerClassName,
  placeholder = 'Pick a date',
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = React.useMemo(
    () => isoDateStringToDate(value),
    [value],
  );

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    onChange(dateToIsoDateString(date));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            'flex h-9 w-full min-w-0 justify-start gap-2 font-normal text-left',
            !value && 'text-muted-foreground',
            triggerClassName,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
          <span className="min-w-0 truncate">
            {value || placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-auto p-0', className)} align="start">
        <div className="rdp-root rounded-md border-0 p-3">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            defaultMonth={selectedDate ?? new Date()}
            showOutsideDays={false}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
