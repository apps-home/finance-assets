'use client'

import { Button } from '@lib/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@lib/ui/components/dialog'
import { Input } from '@lib/ui/components/input'
import { Label } from '@lib/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@lib/ui/components/select'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Category, CategoryType } from '@/features/categories/api/types'
import {
  useCreateCategory,
  useUpdateCategory
} from '@/features/categories/hooks/use-category'
import {
  CATEGORY_TYPE_OPTIONS,
  CURRENCY_OPTIONS
} from '@/features/categories/utils'

const MIN_YEAR = 2020
const MAX_YEAR = 2100

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCategory?: Category | null
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  editingCategory
}: CategoryFormDialogProps) {
  const [formData, setFormData] = useState(() =>
    getInitialFormData(editingCategory)
  )

  function getInitialFormData(category?: Category | null) {
    if (category) {
      return {
        name: category.name,
        currency: category.currency,
        type: category.type || CategoryType.FIXED,
        years: category.years || [],
        targetPercentage: category.targetPercentage ?? null
      }
    }
    return {
      name: '',
      currency: 'BRL',
      type: CategoryType.FIXED,
      years: [new Date().getFullYear()] as number[],
      targetPercentage: null as number | null
    }
  }

  const resetForm = () => {
    setFormData(getInitialFormData())
  }

  useEffect(() => {
    if (!open) return

    setFormData(getInitialFormData(editingCategory))
  }, [open, editingCategory])

  const selectedCurrencyLabel =
    CURRENCY_OPTIONS.find((currency) => currency.value === formData.currency)
      ?.label ?? formData.currency
  const selectedTypeLabel =
    CATEGORY_TYPE_OPTIONS.find((type) => type.value === formData.type)?.label ??
    formData.type

  const { mutateAsync: createCategoryMutation } = useCreateCategory()
  const { mutateAsync: updateCategoryMutation } = useUpdateCategory()

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && editingCategory) {
      setFormData(getInitialFormData(editingCategory))
    } else if (isOpen) {
      resetForm()
    }
    onOpenChange(isOpen)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('O nome da categoria é obrigatório')
      return
    }

    if (formData.years.length === 0) {
      toast.error('Selecione ao menos um ano (competência)')
      return
    }

    if (
      formData.targetPercentage !== null &&
      (formData.targetPercentage < 0 || formData.targetPercentage > 100)
    ) {
      toast.error('A meta de alocação deve estar entre 0% e 100%')
      return
    }

    try {
      if (editingCategory) {
        await updateCategoryMutation({
          id: editingCategory.id,
          dto: {
            name: formData.name,
            currency: formData.currency,
            type: formData.type,
            years: formData.years,
            targetPercentage: formData.targetPercentage
          }
        })
      } else {
        await createCategoryMutation({
          name: formData.name,
          currency: formData.currency,
          type: formData.type,
          years: formData.years,
          targetPercentage: formData.targetPercentage
        })
      }

      onOpenChange(false)
      resetForm()
    } catch {
      // o erro já é exibido pelo toast do hook
    }
  }

  const handleAddYear = (year: number) => {
    if (year.toString().length !== 4) return
    if (year < MIN_YEAR || year > MAX_YEAR) return
    if (formData.years.includes(year)) return

    setFormData((prev) => ({
      ...prev,
      years: [...prev.years, year]
    }))
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
          </DialogTitle>
          <DialogDescription>
            {editingCategory
              ? 'Altere as informações da categoria'
              : 'Preencha as informações para criar uma nova categoria'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nome</Label>
            <Input
              id="category-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Ex: Investimentos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-currency">Moeda</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => {
                if (value) {
                  setFormData((prev) => ({ ...prev, currency: value }))
                }
              }}
            >
              <SelectTrigger id="category-currency">
                <SelectValue placeholder="Selecione a moeda">
                  {selectedCurrencyLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="w-full">
                {CURRENCY_OPTIONS.map((currency) => (
                  <SelectItem
                    key={currency.value}
                    value={currency.value}
                    className="mx-2 py-4"
                  >
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => {
                if (value) {
                  setFormData((prev) => ({
                    ...prev,
                    type: value as CategoryType
                  }))
                }
              }}
            >
              <SelectTrigger id="category-type">
                <SelectValue placeholder="Selecione o tipo">
                  {selectedTypeLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="w-full">
                {CATEGORY_TYPE_OPTIONS.map((type) => (
                  <SelectItem
                    key={type.value}
                    value={type.value}
                    className="mx-2 py-4"
                  >
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-target">Meta de Alocação (%)</Label>
            <div className="relative">
              <Input
                id="category-target"
                type="number"
                min={0}
                max={100}
                step={0.01}
                placeholder="Ex: 30"
                value={formData.targetPercentage ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  setFormData((prev) => ({
                    ...prev,
                    targetPercentage: val === '' ? null : Number.parseFloat(val)
                  }))
                }}
                className="pr-8"
              />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground text-sm">
                %
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              Defina a porcentagem ideal do seu patrimônio para esta categoria
            </p>
          </div>

          <div className="space-y-2">
            <Label>Competências (Anos)</Label>
            <div className="flex flex-wrap gap-2">
              {formData.years
                .sort((a, b) => a - b)
                .map((year) => (
                  <span
                    key={year}
                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 font-medium text-primary text-xs"
                  >
                    {year}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          years: prev.years.filter((y) => y !== year)
                        }))
                      }
                      className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-primary/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Ex: 2026"
                min={MIN_YEAR}
                max={MAX_YEAR}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const value = parseInt(e.currentTarget.value, 10)
                    handleAddYear(value)
                    e.currentTarget.value = ''
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  const input = e.currentTarget
                    .previousElementSibling as HTMLInputElement
                  const value = parseInt(input.value, 10)
                  handleAddYear(value)
                  input.value = ''
                }}
              >
                Adicionar
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Digite o ano e pressione Enter ou clique em Adicionar
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
