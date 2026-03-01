import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type ComboboxOption<T = string> = {
  value: T;
  label: string;
};

type ComboboxProps<T = string> = {
  options: ComboboxOption<T>[];
  value?: T | null;
  onValueChange?: (value: T | null) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  /** Optional: include an "empty" option (e.g. "All" or "—") */
  allowEmpty?: boolean;
  emptyOption?: { value: T | null; label: string };
  /** Optional: id for the trigger so a <Label htmlFor={id}> can be associated */
  id?: string;
  /** Optional: accessible name when no visible label is used (e.g. aria-label) */
  ariaLabel?: string;
  /** When false, the search input inside the dropdown is hidden. Default true. */
  searchable?: boolean;
};

export function Combobox<T extends string>({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  emptyText = "No results found.",
  searchPlaceholder = "Search...",
  className,
  triggerClassName,
  disabled,
  allowEmpty,
  emptyOption = { value: null, label: "—" },
  id,
  ariaLabel,
  searchable = true,
}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false)
  const listboxId = React.useId()

  const selected = options.find((o) => o.value === value)
  const displayValue = selected?.label ?? (allowEmpty && value == null ? emptyOption.label : placeholder)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full min-w-0 justify-between gap-2 font-normal",
            !value && !(allowEmpty && value == null) && "text-muted-foreground",
            triggerClassName
          )}
        >
          <span className="min-w-0 truncate text-left">{displayValue}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[var(--radix-popover-trigger-width)] p-0", className)} align="start">
        <Command>
          {searchable && <CommandInput placeholder={searchPlaceholder} />}
          <CommandList id={listboxId}>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {allowEmpty && (
                <CommandItem
                  value={emptyOption.label}
                  onSelect={() => {
                    onValueChange?.(emptyOption.value as T | null)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value == null ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {emptyOption.label}
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={String(option.value)}
                  value={option.label}
                  onSelect={() => {
                    onValueChange?.(option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
