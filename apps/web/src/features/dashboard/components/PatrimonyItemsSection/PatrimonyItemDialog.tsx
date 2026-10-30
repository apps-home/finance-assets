'use client'

import { Button } from '@lib/ui/components/button'
import { Checkbox } from '@lib/ui/components/checkbox'
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
import { Loader2, Save } from 'lucide-react'
import { useState } from 'react'

import { formatCurrencyInput } from '@/shared/utils/format-currency-input'
import { parseValue } from '@/shared/utils/parse-value'

import {
  type CreatePatrimonyItemDTO,
  type PatrimonyItem,
  PatrimonyItemType
} from '../../api/types'
import {
  useCreatePatrimonyItem,
  useUpdatePatrimonyItem
} from '../../hooks/use-patrimony-items'
import { PATRIMONY_ITEM_TYPE_LABELS } from '../../utils/patrimony-items'

interface PatrimonyItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: PatrimonyItem | null
}

const toCurrencyInput = (value: number | null | undefined) =>
  value != null && value > 0
    ? formatCurrencyInput(Math.round(value * 100).toString())
    : ''

const toDateInput = (value: string | null | undefined) =>
  value ? value.slice(0, 10) : ''

export function PatrimonyItemDialog({
  open,
  onOpenChange,
  item
}: PatrimonyItemDialogProps) {
  const isEditing = Boolean(item)

  const [type, setType] = useState<PatrimonyItemType>(
    item?.type ?? PatrimonyItemType.VEHICLE
  )
  const [name, setName] = useState(item?.name ?? '')
  const [currentValue, setCurrentValue] = useState(() =>
    toCurrencyInput(item?.currentValue)
  )
  const [purchaseValue, setPurchaseValue] = useState(() =>
    toCurrencyInput(item?.purchaseValue)
  )
  const [acquiredAt, setAcquiredAt] = useState(() =>
    toDateInput(item?.acquiredAt)
  )
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [isActive, setIsActive] = useState(item?.isActive ?? true)

  const { mutateAsync: createItem, isPending: isCreating } =
    useCreatePatrimonyItem()
  const { mutateAsync: updateItem, isPending: isUpdating } =
    useUpdatePatrimonyItem()

  const isPending = isCreating || isUpdating
  const isLiability = type === PatrimonyItemType.LIABILITY

  const parsedCurrentValue = parseValue(currentValue)
  const parsedPurchaseValue = purchaseValue.trim()
    ? parseValue(purchaseValue)
    : null
  const canSubmit = name.trim().length >= 2 && parsedCurrentValue >= 0

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit) return

    const payload: CreatePatrimonyItemDTO = {
      name: name.trim(),
      type,
      currentValue: parsedCurrentValue,
      purchaseValue: parsedPurchaseValue,
      acquiredAt: acquiredAt.trim() ? acquiredAt.trim() : null,
      notes: notes.trim() ? notes.trim() : null,
      isActive
    }

    try {
      if (item) {
        await updateItem({ id: item.id, dto: payload })
      } else {
        await createItem(payload)
      }
      onOpenChange(false)
    } catch {
      // o erro já é exibido pelo toast do hook de mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="patrimony-item-dialog" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar item patrimonial' : 'Adicionar bem ou passivo'}
          </DialogTitle>
          <DialogDescription>
            {isLiability
              ? 'Informe o saldo devedor atual para descontar do seu Patrimônio Líquido (Net Worth).'
              : 'Cadastre imóveis, veículos ou equipamentos pelo valor estimado atual (ex.: Tabela FIPE).'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="patrimony-item-type" className="text-xs">
                Tipo
              </Label>
              <Select
                value={type}
                onValueChange={(val) =>
                  val && setType(val as PatrimonyItemType)
                }
              >
                <SelectTrigger
                  id="patrimony-item-type"
                  className="h-9 w-full text-xs"
                >
                  <SelectValue>{PATRIMONY_ITEM_TYPE_LABELS[type]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(
                      PATRIMONY_ITEM_TYPE_LABELS
                    ) as PatrimonyItemType[]
                  ).map((itemType) => (
                    <SelectItem
                      key={itemType}
                      value={itemType}
                      className="text-xs"
                    >
                      {PATRIMONY_ITEM_TYPE_LABELS[itemType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="patrimony-item-name" className="text-xs">
                Nome / Descrição
              </Label>
              <Input
                id="patrimony-item-name"
                placeholder={
                  isLiability
                    ? 'Ex.: Financiamento Imobiliário'
                    : 'Ex.: Carro (Tabela FIPE)'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="patrimony-item-current" className="text-xs">
                {isLiability
                  ? 'Saldo devedor atual (R$)'
                  : 'Valor estimado atual (R$)'}
              </Label>
              <Input
                id="patrimony-item-current"
                inputMode="numeric"
                placeholder="0,00"
                value={currentValue}
                onChange={(e) =>
                  setCurrentValue(formatCurrencyInput(e.target.value))
                }
                className="h-9 text-xs tabular-nums"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="patrimony-item-purchase" className="text-xs">
                {isLiability
                  ? 'Valor original financiado (opcional)'
                  : 'Valor de aquisição (opcional)'}
              </Label>
              <Input
                id="patrimony-item-purchase"
                inputMode="numeric"
                placeholder="0,00"
                value={purchaseValue}
                onChange={(e) =>
                  setPurchaseValue(formatCurrencyInput(e.target.value))
                }
                className="h-9 text-xs tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="patrimony-item-date" className="text-xs">
                {isLiability
                  ? 'Data de contratação (opcional)'
                  : 'Data de aquisição (opcional)'}
              </Label>
              <Input
                id="patrimony-item-date"
                type="date"
                value={acquiredAt}
                onChange={(e) => setAcquiredAt(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="patrimony-item-notes" className="text-xs">
                Observações (opcional)
              </Label>
              <Input
                id="patrimony-item-notes"
                placeholder="Ex.: FIPE ref. Out/2026"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="patrimony-item-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(Boolean(checked))}
            />
            <Label
              htmlFor="patrimony-item-active"
              className="cursor-pointer font-normal text-muted-foreground text-xs"
            >
              Contabilizar este item no cálculo do Patrimônio Líquido (Net
              Worth)
            </Label>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!canSubmit || isPending}
              className="gap-1.5 text-xs"
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              {isEditing ? 'Salvar alterações' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
