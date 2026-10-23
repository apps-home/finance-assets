'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select'
import { cn } from '@/shared/lib/utils'

export interface FilterOption {
  value: string
  label: string
}

interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
  className?: string
}

export function FilterSelect({
  value,
  onChange,
  options,
  className
}: FilterSelectProps) {
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? value

  return (
    <div
      data-slot="filter-select"
      className={cn('w-full sm:w-auto', className)}
    >
      <Select value={value} onValueChange={(next) => next && onChange(next)}>
        <SelectTrigger className="h-9 w-full text-xs">
          <SelectValue>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent className="w-full">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="mx-1 py-2 text-xs"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
