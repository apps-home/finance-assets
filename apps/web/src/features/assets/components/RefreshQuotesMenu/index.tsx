'use client'

import { Button } from '@lib/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@lib/ui/components/dropdown-menu'
import { cn } from '@lib/ui/lib/utils'
import { RefreshCw } from 'lucide-react'

import { useRefreshCategoryQuotes } from '@/features/assets/hooks/use-assets'
import { type Category, CategoryType } from '@/features/categories/api/types'
import { CATEGORY_TYPE_LABELS } from '@/features/categories/utils'

interface RefreshQuotesMenuProps {
  categories: Category[]
}

export function RefreshQuotesMenu({ categories }: RefreshQuotesMenuProps) {
  const {
    mutate: refreshQuotes,
    isPending,
    variables: refreshingCategoryId
  } = useRefreshCategoryQuotes()

  // Renda fixa não tem cotação de mercado
  const quotedCategories = categories.filter(
    (category) => category.type !== CategoryType.FIXED
  )
  const refreshingCategory = quotedCategories.find(
    (category) => category.id === refreshingCategoryId
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-slot="refresh-quotes-menu"
        disabled={isPending || quotedCategories.length === 0}
        render={<Button variant="outline" className="gap-2" />}
      >
        <RefreshCw className={cn('size-4', isPending && 'animate-spin')} />
        {isPending && refreshingCategory
          ? `Atualizando ${refreshingCategory.name}...`
          : 'Atualizar cotações'}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Atualizar cotações da categoria</DropdownMenuLabel>
          {quotedCategories.map((category) => (
            <DropdownMenuItem
              key={category.id}
              onClick={() => refreshQuotes(category.id)}
              className="flex-col items-start gap-0.5"
            >
              <span className="font-medium text-foreground">
                {category.name}
              </span>
              <span className="text-muted-foreground">
                {CATEGORY_TYPE_LABELS[category.type]}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
